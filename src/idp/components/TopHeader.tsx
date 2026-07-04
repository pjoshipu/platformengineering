import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes, Bell, Search, Settings, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useMockQuery, timeAgo } from "../api/client";
import { getNotifications, globalSearch } from "../api/common";
import { getPersonaModule } from "../personas/registry";
import { cn } from "@/lib/utils";

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-tech-cyan",
  warning: "bg-yellow-500",
  critical: "bg-destructive",
};

export const TopHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const persona = user ? getPersonaModule(user.persona) : undefined;
  const { data: notifications } = useMockQuery(getNotifications, []);
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const [query, setQuery] = useState("");
  // Search is scoped to the logged-in persona — you only see your own assets.
  const { data: allResults } = useMockQuery(() => globalSearch(query), [query]);
  const results = (allResults ?? []).filter(
    (r) => !user || r.path.startsWith(`/${user.persona}`)
  );

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card flex items-center gap-3 px-4">
      {/* Logo */}
      <Link to="/idp" className="flex items-center gap-2 font-semibold shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Boxes className="w-5 h-5 text-primary" />
        </div>
        <span className="hidden sm:inline">Platform IDP</span>
      </Link>

      {/* Global search */}
      <div className="flex-1 max-w-xl mx-auto relative">
        <Popover open={query.length > 0}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps, models, pipelines, policies…"
                className="pl-9"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[--radix-popover-trigger-width] p-1"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {results && results.length > 0 ? (
              results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(`/idp${r.path}`);
                    setQuery("");
                  }}
                  className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                >
                  <span>{r.label}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {r.kind}
                  </Badge>
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground">No matches</p>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative p-2 rounded-lg hover:bg-muted">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(notifications ?? []).map((n) => (
            <DropdownMenuItem key={n.id} className="flex items-start gap-2 py-2">
              <span className={cn("mt-1 h-2 w-2 rounded-full shrink-0", SEVERITY_DOT[n.severity])} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground truncate">{n.detail}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg hover:bg-muted p-1 pr-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">{user?.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{persona?.blurb}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => user && navigate(`/idp/${user.persona}/profile`)}>
            <User className="w-4 h-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => user && navigate(`/idp/${user.persona}/settings`)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default TopHeader;
