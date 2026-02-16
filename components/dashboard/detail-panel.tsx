// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Components
// Slide-in detail panel for org members

"use client";

import { X, Mail, Phone, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { OrgMember } from "@/lib/actions/dashboard";

type DetailPanelProps = {
  member: OrgMember | null;
  isOpen: boolean;
  onClose: () => void;
};

export function DetailPanel({ member, isOpen, onClose }: DetailPanelProps) {
  if (!member) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Member Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Photo and Name */}
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={member.photoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-xl font-bold">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">@{member.username}</p>
            </div>

            {/* Badges */}
            <div className="flex justify-center gap-2">
              {member.isDirect ? (
                <Badge className="bg-green-500 text-white">Direct Enrollee</Badge>
              ) : member.isSpillover ? (
                <Badge className="bg-orange-500 text-white">Spillover</Badge>
              ) : (
                <Badge variant="secondary">Downline</Badge>
              )}
              <Badge variant="outline">Level {member.depth}</Badge>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              {member.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {member.enrollerName && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enrolled By</p>
                    <p className="text-sm text-muted-foreground">{member.enrollerName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Organization Size</p>
                  <p className="text-sm text-muted-foreground">
                    {member.childCount} direct {member.childCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Matrix Position</p>
                  <p className="text-sm text-muted-foreground">
                    Level {member.depth}, Position {member.positionIndex}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
