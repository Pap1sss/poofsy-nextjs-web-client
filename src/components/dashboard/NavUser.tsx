"use client";

import Link from "next/link";
import { ChevronRightIcon, LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { routes } from "@/config/routes";
import { useLogoutMutation } from "@/features/auth/hooks/useLogoutMutation";

/**
 * First and last initials, e.g. "Exiquiel John Pines" → "EP". Middle names are
 * skipped and a single-word name yields one letter. Same shape as the profile
 * page's `first_name[0] + last_name[0]`, derived from the joined name because
 * that is all this component is given.
 */
function initialsFrom(name?: string) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "?";

  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

export default function NavUser({ user }: { user?: { name?: string; email?: string } }) {
  const { mutate: logout } = useLogoutMutation();
  const { isMobile, state } = useSidebar();
  const initials = initialsFrom(user?.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="pixel-box bg-card data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="border-outline border-2">
                <AvatarFallback className="bg-highlight text-highlight-foreground font-pixel">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronRightIcon />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : state === "collapsed" ? "right" : "top"}
            align="end"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={routes.profile}>
                  <Item size="xs">
                    <ItemMedia>
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{user?.name}</ItemTitle>
                      <ItemDescription>{user?.email}</ItemDescription>
                    </ItemContent>
                  </Item>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={routes.profile}>
                  <UserRound size={14} className="mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                <LogOut size={14} className="mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
