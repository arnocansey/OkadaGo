import { DeliveryDetailsClient } from "./delivery-details-client";

type Params = { params: Promise<{ deliveryId: string }> };

export default async function DeliveryDetailsPage({ params }: Params) {
  const { deliveryId } = await params;
  return <DeliveryDetailsClient deliveryId={deliveryId} />;
}
