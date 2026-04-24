import { MockupShowcase } from "@/components/showcase/mockup-showcase";

export const metadata = {
  title: "UI Library | OkadaGo"
};

export default async function UiShowcasePage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolved = await params;

  return <MockupShowcase slug={resolved.slug} />;
}
