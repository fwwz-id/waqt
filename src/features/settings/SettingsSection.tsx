import type { ReactNode } from "react";

export function SettingsSection({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1 text-muted-foreground">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {desc && <p className="px-1 text-xs text-muted-foreground">{desc}</p>}
      {children}
    </section>
  );
}
