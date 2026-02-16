// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Genealogy Tree
// Team view with tree and list tabs

"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreeViewComponent } from "@/components/dashboard/tree-view";
import { ListViewComponent } from "@/components/dashboard/list-view";
import { DetailPanel } from "@/components/dashboard/detail-panel";
import { getOrgTree, getOrgList, type OrgMember } from "@/lib/actions/dashboard";
import type { TreeNode } from "@/lib/actions/dashboard";

type TeamViewProps = {
  userId: string;
};

export function TeamView({ userId }: TeamViewProps) {
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleMemberClick = (member: OrgMember) => {
    setSelectedMember(member);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedMember(null), 300);
  };

  return (
    <>
      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-6">
          <TreeViewComponent onMemberClick={handleMemberClick} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ListViewComponent onMemberClick={handleMemberClick} />
        </TabsContent>
      </Tabs>

      <DetailPanel
        member={selectedMember}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </>
  );
}
