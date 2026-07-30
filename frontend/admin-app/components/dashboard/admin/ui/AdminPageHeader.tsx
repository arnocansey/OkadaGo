import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Compact page header — title in content, actions on the right. */
export function AdminPageHeader({ title, subtitle, actions }: Props) {
  if (!title && !subtitle && !actions) return null;

  return (
    <div className="admin-page-header admin-page-header--compact">
      {(title || subtitle) && (
        <div className="admin-page-header-copy">
          {title ? <h1>{title}</h1> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      )}
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </div>
  );
}
