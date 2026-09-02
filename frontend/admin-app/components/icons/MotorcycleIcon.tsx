import React from "react";

interface MotorcycleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Authentic Motorcycle Icon for React Web Admin
 * Renders a genuine motorcycle silhouette (thick tires, engine block, tank, seat, and exhaust)
 * replacing the bicycle icon.
 */
export function MotorcycleIcon({
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
  ...props
}: MotorcycleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Rear Wheel */}
      <circle cx="5" cy="16" r="3.5" />
      <circle cx="5" cy="16" r="1" fill={color} />

      {/* Front Wheel */}
      <circle cx="19" cy="16" r="3.5" />
      <circle cx="19" cy="16" r="1" fill={color} />

      {/* Front Fork & Handlebars */}
      <path d="M19 16L15.5 8.5H13M16.5 7H14.5" />

      {/* Fuel Tank & Frame */}
      <path d="M15.5 8.5C14.5 7.5 12 7.5 10.5 8.5L8 9.5" />

      {/* Padded Seat */}
      <path d="M6 10.5C7.5 9.5 9.5 9.5 10.5 10.5" />

      {/* Engine Block */}
      <path d="M5 16L9 11L12.5 11L11.5 16H8.5" />

      {/* Sweeping Exhaust Pipe */}
      <path d="M10 15H3.5" />

      {/* Headlight */}
      <path d="M17.5 9.5H19" />
    </svg>
  );
}

export default MotorcycleIcon;
