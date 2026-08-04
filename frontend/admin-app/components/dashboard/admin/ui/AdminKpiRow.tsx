import type { ReactNode } from "react";

export type AdminKpiItem = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "yellow" | "green" | "red" | "neutral";
};

type Props = {
  items: AdminKpiItem[];
};

export function AdminKpiRow({ items }: Props) {
  return (
    <section className="admin-kpi-grid">
      {items.map((item) => (
        <article key={item.label} className="admin-reference-kpi">
          {item.icon ? (
            <div className={`admin-reference-kpi-icon ${item.tone ?? "yellow"}`}>{item.icon}</div>
          ) : null}
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.hint ? <small>{item.hint}</small> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
