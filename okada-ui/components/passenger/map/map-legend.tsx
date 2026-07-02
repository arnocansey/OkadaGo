"use client";

export type MapLegendItem = {
  label: string;
  color: string;
  pulse?: boolean;
};

export function MapLegend({ items }: { items: MapLegendItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="pax-map-legend" aria-label="Map legend">
      {items.map((item) => (
        <span key={item.label} className="pax-map-legend-item">
          <span
            className={`pax-map-legend-dot${item.pulse ? " pax-map-legend-dot--pulse" : ""}`}
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export const MAP_LEGEND = {
  you: { label: "You", color: "#0A84FF", pulse: true },
  rider: { label: "Riders", color: "#FFC107" },
  pickup: { label: "Pickup", color: "#FFC107" },
  dropoff: { label: "Dropoff", color: "#FF3B30" }
} as const satisfies Record<string, MapLegendItem>;
