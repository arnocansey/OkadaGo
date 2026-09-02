import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface MotorcycleIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Authentic Motorcycle Icon for React Native
 * Displays a realistic motorcycle silhouette (wide tires, engine, fuel tank, seat, and exhaust)
 * instead of a bicycle.
 */
export function MotorcycleIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2
}: MotorcycleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Rear Wheel with tire thickness */}
      <Circle cx="5" cy="16" r="3.5" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="5" cy="16" r="1" fill={color} />

      {/* Front Wheel with tire thickness */}
      <Circle cx="19" cy="16" r="3.5" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="19" cy="16" r="1" fill={color} />

      {/* Front Fork & Handlebars */}
      <Path
        d="M19 16L15.5 8.5H13M16.5 7H14.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fuel Tank & Frame */}
      <Path
        d="M15.5 8.5C14.5 7.5 12 7.5 10.5 8.5L8 9.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Padded Motorcycle Seat */}
      <Path
        d="M6 10.5C7.5 9.5 9.5 9.5 10.5 10.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Engine Block & Chassis Bottom */}
      <Path
        d="M5 16L9 11L12.5 11L11.5 16H8.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sweeping Exhaust Pipe */}
      <Path
        d="M10 15H3.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Headlight */}
      <Path
        d="M17.5 9.5H19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default MotorcycleIcon;
