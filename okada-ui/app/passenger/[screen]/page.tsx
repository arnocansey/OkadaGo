import { notFound } from "next/navigation";

export default async function PassengerScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  void screen;
  notFound();
}
