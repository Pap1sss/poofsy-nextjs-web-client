"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Loader, LogOut, Monitor, Moon, MoonStar, Search, Sun, UserRound } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { commandActions, commandPages, type CommandLink } from "@/config/commands";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth";
import { useLogoutMutation } from "@/features/auth/hooks/useLogoutMutation";
import { userPermissions } from "@/features/user/constant";
import { userApiClient } from "@/features/user/api";
import { canAccess } from "@/lib/utils/nav";

const THEMES = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "dim", label: "Dim theme", icon: MoonStar },
  { value: "system", label: "System theme", icon: Monitor },
];

// Every typed word must appear in the label or keywords. cmdk's default fuzzy
// scoring matches scattered letters ("adm" -> "Dark theme"), which reads as noise.
const filterCommands = (value: string, search: string, keywords?: string[]) => {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);

  return words.every((word) => haystack.includes(word)) ? 1 : 0;
};

/** Header search + Ctrl/⌘+K command palette: pages, actions, live user search, theme and logout. */
export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { mutate: logout } = useLogoutMutation();
  const { data: auth } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search.trim(), 250);

  const permissions = auth?.data?.permissions ?? [];
  const roles = auth?.data?.roles ?? [];
  const onboarded = auth?.data?.onboarded ?? false;
  const allowed = (item: CommandLink) =>
    (onboarded || !item.requiresOnboarding) && canAccess(item.permissions, permissions, roles);
  const canSearchUsers = canAccess([userPermissions.ViewAny], permissions, roles);

  const userResults = useQuery({
    queryKey: ["command-menu", "users", debouncedSearch],
    queryFn: () => userApiClient.fetchUserOptions({ search: debouncedSearch }),
    enabled: open && canSearchUsers && debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "g")) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    setSearch("");
    action();
  };

  const pages = commandPages.filter(allowed);
  const actions = commandActions.filter(allowed);
  // Results for a previous query stay hidden while the new one is still debouncing.
  const searchIsCurrent = debouncedSearch === search.trim();
  const users = searchIsCurrent ? (userResults.data?.data ?? []) : [];

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative h-11 justify-start gap-2 text-muted-foreground font-normal sm:h-9 sm:w-56 lg:w-72"
        aria-label="Search or run a command"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search or type a command</span>
        <Kbd className="ml-auto hidden sm:inline-flex">Ctrl K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
        title="Command palette"
        description="Search pages, actions and users"
        className="sm:max-w-xl"
      >
        <Command filter={filterCommands}>
          <CommandInput
            placeholder="Search pages, actions or people…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{userResults.isFetching ? "Searching…" : "No results."}</CommandEmpty>

            {actions.length > 0 && (
              <CommandGroup heading="Actions">
                {actions.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    keywords={item.keywords}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    {item.icon && <item.icon />}
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Pages">
              {pages.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  keywords={item.keywords}
                  onSelect={() => run(() => router.push(item.href))}
                >
                  {item.icon && <item.icon />}
                  {item.label}
                  <CommandShortcut>Go to</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* After pages and actions, so Enter on a typed command never jumps to a person. */}
            {canSearchUsers &&
              searchIsCurrent &&
              debouncedSearch.length >= 2 &&
              (users.length > 0 || userResults.isFetching) && (
                <CommandGroup heading="Users" forceMount>
                  {userResults.isFetching && users.length === 0 && (
                    <CommandItem disabled forceMount value="__searching">
                      <Loader className="animate-spin" />
                      Searching users…
                    </CommandItem>
                  )}
                  {users.map((user) => (
                    <CommandItem
                      key={user.value}
                      // The API already matched name, email or username, so skip cmdk's own text filter.
                      forceMount
                      value={`user:${user.value}`}
                      onSelect={() => run(() => router.push(routes.users.detail(user.value)))}
                    >
                      <UserRound />
                      {user.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

            <CommandSeparator />

            <CommandGroup heading="Preferences">
              {THEMES.map((theme) => (
                <CommandItem
                  key={theme.value}
                  value={theme.label}
                  keywords={["appearance", "mode"]}
                  onSelect={() => run(() => setTheme(theme.value))}
                >
                  <theme.icon />
                  {theme.label}
                </CommandItem>
              ))}
              <CommandItem
                value="Log out"
                keywords={["sign out", "exit"]}
                onSelect={() => run(() => logout())}
              >
                <LogOut />
                Log out
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd> close
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
