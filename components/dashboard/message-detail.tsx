// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Contact Submissions
// Message detail modal

"use client";

import { X, Mail, Phone, Calendar, ExternalLink, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard";
import type { ContactSubmission } from "@/lib/db/schema";

type MessageDetailProps = {
  contact: ContactSubmission;
  isOpen: boolean;
  onClose: () => void;
  onArchive: (contactId: string) => void;
};

export function MessageDetail({
  contact,
  isOpen,
  onClose,
  onArchive,
}: MessageDetailProps) {
  const handleReply = () => {
    const subject = `Re: Contact from ${contact.visitorName}`;
    const body = `Hi ${contact.visitorName},\n\nThank you for your message:\n\n"${contact.message}"\n\n`;
    window.open(
      `mailto:${contact.visitorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

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
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Message Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={contact.status} type="contact" />
              <p className="text-xs text-muted-foreground">
                {contact.readAt
                  ? `Read ${new Date(contact.readAt).toLocaleDateString()}`
                  : "Unread"}
              </p>
            </div>

            {/* Sender Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">From</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.visitorName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contact.visitorEmail}
                  </p>
                </div>
              </div>

              {contact.visitorPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.visitorPhone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Received</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString()}{" "}
                    {new Date(contact.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Message</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full" onClick={handleReply}>
                <Mail className="h-4 w-4 mr-2" />
                Reply via Email
              </Button>

              {contact.status !== "archived" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onArchive(contact.id)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Message
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
