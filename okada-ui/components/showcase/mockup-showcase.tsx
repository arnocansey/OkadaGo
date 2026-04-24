"use client";

import Link from "next/link";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { findMockupScreen, groupedMockupScreens } from "@/components/showcase/mockup-registry";

export function MockupExactScreen({ slug }: { slug: string[] }) {
  const selected = findMockupScreen(slug);

  if (!selected) {
    return null;
  }

  const ScreenComponent = selected.component;
  return (
    <div className="mockup-exact-screen">
      <ScreenComponent />
    </div>
  );
}

export function MockupScreenCanvas({ slug }: { slug: string[] }) {
  const selected = findMockupScreen(slug);

  if (!selected) {
    return (
      <ImmersivePage className="mockup-showcase-page">
        <header className="mockup-showcase-topbar">
          <div>
            <p className="workspace-tag">UI library</p>
            <h1>Screen Not Found</h1>
            <p>The requested mockup route does not exist in the provided screen pack.</p>
          </div>
          <div className="button-row">
            <Link href="/ui" className="button">
              Back to library
            </Link>
          </div>
        </header>
      </ImmersivePage>
    );
  }

  const ScreenComponent = selected.component;

  return (
    <ImmersivePage className="mockup-showcase-page">
      <header className="mockup-showcase-topbar">
        <div>
          <p className="workspace-tag">UI library</p>
          <h1>{selected.title}</h1>
          <p>{selected.description}</p>
        </div>
        <div className="button-row">
          <Link href="/ui" className="button-ghost">
            All screens
          </Link>
        </div>
      </header>

      <section className="mockup-showcase-canvas">
        <MockupExactScreen slug={slug} />
      </section>
    </ImmersivePage>
  );
}

export function MockupShowcase({ slug }: { slug?: string[] }) {
  if (slug?.length) {
    return <MockupScreenCanvas slug={slug} />;
  }

  const groups = groupedMockupScreens();

  return (
    <ImmersivePage className="mockup-showcase-page">
      <header className="mockup-showcase-topbar">
        <div>
          <p className="workspace-tag">UI library</p>
          <h1>All Provided Mockups</h1>
          <p>
            Every supplied passenger, rider, admin, web, and combined mockup screen is now cataloged here.
          </p>
        </div>
        <div className="mockup-count-chip">{Object.keys(groups).length} groups</div>
      </header>

      <div className="mockup-groups">
        {Object.entries(groups).map(([groupName, entries]) => (
          <section key={groupName} className="mockup-group-card">
            <div className="mockup-group-head">
              <h2>{groupName}</h2>
              <span>{entries.length} screens</span>
            </div>
            <div className="mockup-grid">
              {entries.map((entry) => (
                <Link
                  key={entry.slug.join("/")}
                  href={`/ui/${entry.slug.join("/")}`}
                  className="mockup-tile"
                >
                  <strong>{entry.title}</strong>
                  <span>{entry.description}</span>
                  <code>/{entry.slug.join("/")}</code>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ImmersivePage>
  );
}
