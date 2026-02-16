// SPEC: SPEC-PAGES > Org Tree (/admin/org-tree)
// Admin organization tree viewer with search

"use client";

import { useState, useEffect } from "react";
import Tree from "react-d3-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, Maximize, Search, Loader2 } from "lucide-react";
import { getFullOrgTree, type OrgTreeNode } from "@/lib/actions/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Convert OrgTreeNode to react-d3-tree format
function convertToD3Tree(node: OrgTreeNode): any {
  return {
    name: node.username,
    attributes: {
      id: node.id,
      name: node.name,
      username: node.username,
      photoUrl: node.photoUrl,
      status: node.status,
      isSpillover: node.isSpillover,
      depth: node.depth,
    },
    children: node.children.map(convertToD3Tree),
  };
}

export function AdminOrgTree() {
  const [treeData, setTreeData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    setIsLoading(true);
    const data = await getFullOrgTree(7); // Load all 7 levels
    if (data) {
      setTreeData(convertToD3Tree(data));
    }
    setIsLoading(false);

    // Center tree after load
    setTimeout(() => {
      const containerWidth =
        document.getElementById("admin-tree-container")?.clientWidth || 1200;
      const containerHeight =
        document.getElementById("admin-tree-container")?.clientHeight || 700;
      setTranslate({
        x: containerWidth / 2,
        y: 100,
      });
    }, 100);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.3));
  };

  const handleCenter = () => {
    const containerWidth =
      document.getElementById("admin-tree-container")?.clientWidth || 1200;
    setTranslate({
      x: containerWidth / 2,
      y: 100,
    });
    setZoom(0.8);
  };

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: any }) => {
    const attrs = nodeDatum.attributes;
    const status = attrs.status;

    // Color coding by status
    let borderColor = "border-green-500";
    let bgColor = "bg-green-50 dark:bg-green-900/20";
    if (status === "suspended") {
      borderColor = "border-red-500";
      bgColor = "bg-red-50 dark:bg-red-900/20";
    } else if (status === "inactive") {
      borderColor = "border-gray-400";
      bgColor = "bg-gray-50 dark:bg-gray-900/20";
    }

    return (
      <g>
        <foreignObject x="-50" y="-50" width="100" height="130">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${borderColor} ${bgColor} overflow-hidden`}
            >
              {attrs.photoUrl ? (
                <img
                  src={attrs.photoUrl}
                  alt={attrs.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold">
                  {attrs.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-center">
              <div className="font-medium truncate max-w-[100px]">
                {attrs.name}
              </div>
              <div className="text-muted-foreground text-[10px]">
                @{attrs.username}
              </div>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading organization tree...</p>
        </div>
      </Card>
    );
  }

  if (!treeData) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p>No organization tree data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search distributor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleCenter}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-50"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-50"></div>
            <span>Inactive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-50"></div>
            <span>Suspended</span>
          </div>
        </div>

        {/* Tree Container */}
        <div
          id="admin-tree-container"
          className="border rounded-lg bg-white dark:bg-gray-950"
          style={{ height: "700px", width: "100%" }}
        >
          <Tree
            data={treeData}
            orientation="vertical"
            translate={translate}
            zoom={zoom}
            onUpdate={({ zoom, translate }) => {
              setZoom(zoom);
              setTranslate(translate);
            }}
            renderCustomNodeElement={renderCustomNode}
            pathFunc="step"
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            nodeSize={{ x: 150, y: 150 }}
            enableLegacyTransitions
          />
        </div>
      </div>
    </Card>
  );
}
