import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes, Bell, Search, Settings, User, LogOut, Repeat, Check } from "lucide-react";
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

const RECENT_KEY = "idp_search_recent";

const readRecents = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const TopHeader = () => {
  const navigate = useNavigate();
  const { user, profile, personaMatch, directory, savedProfiles, signInAs, logout } = useAuth();
  const persona = user ? getPersonaModule(user.persona) : undefined;
  const { data: notifications } = useMockQuery(getNotifications, []);
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecents());
  // Search is global across the whole portal (spec top bar).
  const { data: results } = useMockQuery(() => globalSearch(query), [query]);

  const pushRecent = (label: string) => {
    const next = [label, ...recents.filter((r) => r !== label)].slice(0, 5);
    setRecents(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const go = (path: string, label?: string) => {
    if (label) pushRecent(label);
    setQuery("");
    setFocused(false);
    navigate(path);
  };

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const showRecents = focused && query.trim().length === 0 && recents.length > 0;
  const showResults = query.trim().length > 0;

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card flex items-center gap-3 px-4">
      {/* Logo → homepage */}
      <Link to="/" className="flex items-center gap-2 font-semibold shrink-0">
        <div className="p-1.5 rounded-lg bg-brand-tint">
          <Boxes className="w-5 h-5 text-brand-purple" />
        </div>
        <span className="hidden sm:inline">Platform IDP</span>
      </Link>

      {/* Global search */}
      <div className="flex-1 max-w-xl mx-auto relative">
        <Popover open={showResults || showRecents}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Search templates, agents, docs..."
                className="pl-9 focus-visible:ring-brand-purple"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[--radix-popover-trigger-width] p-1"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {showResults ? (
              (results ?? []).length > 0 ? (
                (results ?? []).map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r.path, r.label)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                  >
                    <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{r.kind}</Badge>
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.persona && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {getPersonaModule(r.persona)?.label ?? r.persona}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">No matches</p>
              )
            ) : (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recent</div>
                {recents.map((rq) => (
                  <button
                    key={rq}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setQuery(rq)}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{rq}</span>
                  </button>
                ))}
              </>
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
            <DropdownMenuItem key={n.id} className="flex items-start gap-2 py-2" onClick={() => navigate(n.url)}>
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
              <AvatarFallback className="text-xs bg-brand-tint text-brand-purple">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">{user?.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{profile.title}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-purple">
              <Repeat className="w-3 h-3" /> {personaMatch.label} workspace · auto-detected
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => user && navigate(`/${user.persona}/profile`)}>
            <User className="w-4 h-4 mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => user && navigate(`/${user.persona}/settings`)}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> Switch profile</span>
          </DropdownMenuLabel>
          {[...savedProfiles, ...directory].map((emp) => {
            const active = emp.id === profile.id;
            return (
              <DropdownMenuItem
                key={emp.id}
                onClick={() => { signInAs(emp.id); navigate("/"); }}
                className={cn(active && "text-brand-purple")}
              >
                {active ? <Check className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2 opacity-60" />}
                <span className="flex-1 truncate">{emp.name}</span>
                <span className="ml-2 text-[10px] text-muted-foreground truncate">{emp.title}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default TopHeader;
