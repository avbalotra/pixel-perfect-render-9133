import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Boxes, LogOut, Menu, Plus, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/new-analysis", label: "New Analysis" },
  { to: "/materials", label: "Materials" },
  { to: "/history", label: "History" },
  { to: "/reports", label: "Reports" },
] as const;

const NOTIFICATIONS = [
  { title: "Material library updated", body: "13 reference packaging materials available." },
  { title: "Demo scenario ready", body: "Run the Tomato chilled-chain demo in one click." },
  { title: "Prototype notice", body: "All scores are decision-support estimates." },
];

export function AppNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:px-4",
          scrolled ? "glass-strong" : "glass",
        )}
        aria-label="Primary"
      >
        <Link to="/" className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold tracking-tight">PACKWISE AI</span>
            <span className="hidden text-[10px] tracking-wide text-muted-foreground sm:block">
              Smart Packaging Decisions
            </span>
          </span>
        </Link>

        <div className="mx-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-secondary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NOTIFICATIONS.map((n) => (
                <div key={n.title} className="px-2 py-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Account">
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.email ?? "Guest session"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile & settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/history">Analysis history</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/auth">Sign in</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild className="hidden rounded-xl sm:inline-flex">
            <Link to="/new-analysis">
              <Plus className="size-4" /> New Analysis
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="glass-strong mx-auto mt-2 max-w-7xl rounded-2xl p-2 lg:hidden"
          >
            <ul className="grid gap-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/profile" className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Profile
                </Link>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
