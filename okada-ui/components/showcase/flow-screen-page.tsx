"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { useAuth } from "@/lib/auth";
import {
  ResponsiveFlowScreen,
  resolveResponsiveFlowSlug,
  useIsDesktop
} from "@/components/showcase/responsive-mockup-screen";
import {
  getFlowScreen,
  type FlowArea
} from "@/components/showcase/flow-config";

export function FlowScreenPage({
  area,
  screen
}: {
  area: FlowArea;
  screen: string;
}) {
  const router = useRouter();
  const { session, status, signOut } = useAuth();
  const isDesktop = useIsDesktop();
  const current = getFlowScreen(area, screen);

  if (!current) {
    return (
      <ImmersivePage className="adaptive-web-page">
        <div className="flow-route-fallback">
          <div className="flow-route-fallback-card">
            <p className="workspace-tag">Flow</p>
            <h1>Screen not found</h1>
            <p>This screen is not mapped in the current flow.</p>
          </div>
        </div>
      </ImmersivePage>
    );
  }

  const roleMatches =
    !session ||
    (area === "passenger" && session.user.role === "passenger") ||
    (area === "rider" && session.user.role === "rider") ||
    (area === "admin" && session.user.role === "admin");
  const requiresAuth = current.protected;
  const showAuthWarning = requiresAuth && (status !== "authenticated" || !roleMatches);
  const resolvedSlug = resolveResponsiveFlowSlug(area, screen, isDesktop);
  const loginHref = area === "admin" ? "/admin/login" : area === "rider" ? "/rider/login" : "/login";

  if (resolvedSlug.join("/") !== `${area}/${screen}` && !showAuthWarning) {
    return (
      <ImmersivePage className="adaptive-web-page">
        <ResponsiveFlowScreen area={area} screen={screen} />
      </ImmersivePage>
    );
  }

  return (
    <ImmersivePage className="adaptive-web-page">
      {showAuthWarning ? (
        <div className="flow-auth-wall">
          <div className="flow-auth-wall-card">
            <p className="workspace-tag">{area} access</p>
            <h2>Authentication Required</h2>
            <p>
              {status === "loading"
                ? "Checking your session before opening this screen."
                : "You need the correct account to view this screen."}
            </p>
            <div className="button-row">
              <Link href={loginHref} className="button">
                Go to {area} login
              </Link>
              {session ? (
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.href = loginHref;
                    });
                  }}
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="responsive-flow-canvas">
        <ResponsiveFlowScreen area={area} screen={screen} />
      </section>
    </ImmersivePage>
  );
}
