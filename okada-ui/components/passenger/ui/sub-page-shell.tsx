"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SubPageShellProps = {
  title: string;
  children: React.ReactNode;
  backHref?: string;
};

export function SubPageShell({ title, children, backHref = "/passenger/profile" }: SubPageShellProps) {
  return (
    <div className="pax-page">
      <div className="pax-page-header flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pax-text)] hover:bg-[var(--pax-surface)]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1>{title}</h1>
      </div>

      <div className="pax-page-content">
        <div className="mb-6 hidden items-center gap-3 lg:flex">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pax-border)] hover:bg-[var(--pax-surface)]"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="pax-page-title !mb-0">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
