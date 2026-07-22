import { notFound } from "next/navigation";
import { MockupShowcase } from "@/components/showcase/mockup-showcase";

export const metadata = {
  title: "UI Showcase (not production) | OkadaGo"
};

function showcaseEnabled() {
  if (process.env.ENABLE_UI_SHOWCASE === "true") return true;
  if (process.env.ENABLE_UI_SHOWCASE === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export default async function UiShowcasePage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  if (!showcaseEnabled()) {
    notFound();
  }

  const resolved = await params;
  return <MockupShowcase slug={resolved.slug} />;
}
