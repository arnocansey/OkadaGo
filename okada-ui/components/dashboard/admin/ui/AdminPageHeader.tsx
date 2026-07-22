import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="admin-page-header">
      <div className="admin-page-header-copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </div>
  );
}
