"use client";

type DeliveryFormState = {
  recipientName: string;
  recipientPhoneE164: string;
  packageType: string;
  packageDescription: string;
};

type DeliveryFormProps = {
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
};

export function DeliveryForm({
  deliveryForm,
  setDeliveryForm
}: DeliveryFormProps) {
  return (
    <div className="exact-ride-options">
      <h3>Package details</h3>
      <div className="field-group">
        <label className="field-label">Recipient name</label>
        <input
          className="input"
          value={deliveryForm.recipientName}
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              recipientName: event.target.value
            }))
          }
          placeholder="Recipient name"
        />
      </div>
      <div className="field-group">
        <label className="field-label">Recipient phone</label>
        <input
          className="input"
          value={deliveryForm.recipientPhoneE164}
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              recipientPhoneE164: event.target.value
            }))
          }
          placeholder="+233..."
        />
      </div>
      <div className="field-group">
        <label className="field-label">Package type</label>
        <input
          className="input"
          value={deliveryForm.packageType}
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              packageType: event.target.value
            }))
          }
          placeholder="parcel"
        />
      </div>
      <div className="field-group">
        <label className="field-label">Package description</label>
        <textarea
          className="textarea"
          value={deliveryForm.packageDescription}
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              packageDescription: event.target.value
            }))
          }
          placeholder="Describe what the rider is carrying"
        />
      </div>
    </div>
  );
}
