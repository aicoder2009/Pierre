"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  isCollapsed: boolean;
}

export function UserMenu({ isCollapsed }: UserMenuProps) {
  const { user } = useUser();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2",
        isCollapsed && "justify-center px-2"
      )}
    >
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            avatarBox: "w-7 h-7",
          },
        }}
      />
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate text-sidebar-foreground">
            {user?.firstName ?? user?.username ?? "User"}
          </p>
        </div>
      )}
    </div>
  );
}
