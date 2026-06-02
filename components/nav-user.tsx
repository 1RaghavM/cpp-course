"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  BarChart3Icon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="relative" ref={menuRef}>
          <SidebarMenuButton
            size="lg"
            className="data-[active=true]:bg-muted"
            onClick={() => setMenuOpen(!menuOpen)}
            data-active={menuOpen}
          >
            <Avatar className="size-8 rounded-lg grayscale">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-foreground/70">{user.email}</span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </SidebarMenuButton>

          {menuOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <Separator className="my-1" />
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <CircleUserRoundIcon className="size-4" />
                Account
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <BarChart3Icon className="size-4" />
                Progress
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <BellIcon className="size-4" />
                Notifications
              </button>
              <Separator className="my-1" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOutIcon className="size-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
