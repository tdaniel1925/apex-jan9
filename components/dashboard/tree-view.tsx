// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Genealogy Tree
// Tree view using react-d3-tree

"use client";

import { useState, useEffect } from "react";
import Tree from "react-d3-tree";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { getOrgTree, type TreeNode, type OrgMember } from "@/lib/actions/dashboard";
import { TreeSkeleton } from "@/components/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type TreeViewProps = {
  onMemberClick: (member: OrgMember) => void;
};

export function TreeViewComponent({ onMemberClick }: TreeViewProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    setIsLoading(true);
    const data = await getOrgTree(3);
    setTreeData(data);
    setIsLoading(false);

    // Center tree after load
    setTimeout(() => {
      const containerWidth = document.getElementById("tree-container")?.clientWidth || 800;
      const containerHeight = document.getElementById("tree-container")?.clientHeight || 600;
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
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleCenter = () => {
    const containerWidth = document.getElementById("tree-container")?.clientWidth || 800;
    setTranslate({
      x: containerWidth / 2,
      y: 100,
    });
    setZoom(1);
  };

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: unknown }) => {
    const node = nodeDatum as TreeNode;
    const attrs = node.attributes;
    const isDirect = attrs.isDirect;
    const isSpillover = attrs.isSpillover;

    return (
      <g>
        <foreignObject x="-50" y="-50" width="100" height="120">
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              onMemberClick({
                id: attrs.id,
                firstName: attrs.firstName,
                lastName: attrs.lastName,
                email: attrs.email,
                phone: null,
                photoUrl: attrs.photoUrl,
                username: attrs.username,
                status: "active",
                enrollerId: null,
                enrollerName: null,
                isDirect: attrs.isDirect,
                isSpillover: attrs.isSpillover,
                depth: attrs.depth,
                positionIndex: attrs.positionIndex,
                joinedAt: new Date(attrs.joinedAt),
                childCount: attrs.childCount,
              });
            }}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                isDirect
                  ? "border-green-500 bg-green-50"
                  : isSpillover
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              {attrs.photoUrl ? (
                <img
                  src={attrs.photoUrl}
                  alt={node.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="text-xs font-bold">
                  {attrs.firstName[0]}
                  {attrs.lastName[0]}
                </div>
              )}
            </div>
            <div className="mt-1 text-xs text-center w-20 truncate">
              {node.name}
            </div>
            {isDirect && (
              <div className="mt-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                Direct
              </div>
            )}
            {isSpillover && (
              <div className="mt-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                Spillover
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  if (isLoading) {
    return <TreeSkeleton />;
  }

  if (!treeData) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-lg font-medium">No Team Members Yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Share your replicated site link to start building your team!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleCenter}>
              <Maximize className="h-4 w-4 mr-2" />
              Center
            </Button>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-50" />
              <span>Direct Enrollee</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-orange-50" />
              <span>Spillover</span>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div id="tree-container" className="w-full h-[600px] overflow-hidden">
          <Tree
            data={treeData}
            orientation="vertical"
            translate={translate}
            zoom={zoom}
            nodeSize={{ x: 150, y: 150 }}
            separation={{ siblings: 1, nonSiblings: 1.5 }}
            renderCustomNodeElement={renderCustomNode}
            pathFunc="step"
            enableLegacyTransitions
          />
        </div>
      </CardContent>
    </Card>
  );
}
