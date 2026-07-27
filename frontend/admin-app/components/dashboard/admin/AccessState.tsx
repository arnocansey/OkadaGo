import { ImmersivePage } from "@/components/layout/immersive-page";

export function AccessState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <ImmersivePage className="exact-admin-page">
      <div className="flow-auth-wall">
        <div className="flow-auth-wall-card">
          <p className="workspace-tag">admin access</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="button-row">
            <a href={actionHref} className="button">
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </ImmersivePage>
  );
}
