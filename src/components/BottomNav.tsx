import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

export function BottomNav() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: t.nav.home, icon: Home, exact: true },
    { to: "/settings", label: t.nav.settings, icon: Settings, exact: false },
    { to: "/about", label: t.nav.about, icon: Info, exact: false },
  ] as const;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "fill-primary/10")}
                strokeWidth={active ? 2.4 : 1.8}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
