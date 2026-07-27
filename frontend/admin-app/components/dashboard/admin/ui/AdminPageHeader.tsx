import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Title/subtitle live in the shell topbar — this only renders action controls. */
export function AdminPageHeader({ actions }: Props) {
  if (!actions) return null;

  return (
    <div className="admin-page-header admin-page-header--compact">
      <div className="admin-page-header-actions">{actions}</div>
    </div>
  );
}
