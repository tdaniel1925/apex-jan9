// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Dashboard Components
// Notification bell with dropdown

"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { markNotificationRead } from "@/lib/actions";
import { toast } from "sonner";
import type { Notification } from "@/lib/db/schema";

type NotificationBellProps = {
  notifications: Notification[];
  unreadCount: number;
};

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const [localNotifs, setLocalNotifs] = useState(notifications);
  const [localUnread, setLocalUnread] = useState(unreadCount);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationRead(notificationId);
    if (result.success) {
      setLocalNotifs((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      setLocalUnread((prev) => Math.max(0, prev - 1));
    } else {
      toast.error("Failed to mark as read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {localUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {localUnread > 9 ? "9+" : localUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {localNotifs.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {localNotifs.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notif.isRead ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="ml-2 h-2 w-2 bg-blue-600 rounded-full mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {localNotifs.length >= 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-primary">
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
