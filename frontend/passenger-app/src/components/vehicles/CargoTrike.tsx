import Svg, { Circle, Ellipse, Path, Rect, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
};

export function CargoTrike({ width = 220, height = 150, color = "#4CD964", accentColor = "#1a3d22" }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 150" fill="none">
      <Defs>
        <LinearGradient id="triBody" x1="60" y1="50" x2="160" y2="100">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#34A853" />
        </LinearGradient>
        <LinearGradient id="cargoBox" x1="100" y1="55" x2="170" y2="55">
          <Stop offset="0%" stopColor="#f5f5f5" />
          <Stop offset="100%" stopColor="#e0e0e0" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="110" cy="138" rx="80" ry="6" fill="rgba(0,0,0,0.15)" />

      {/* Rear wheel (left) */}
      <Circle cx="52" cy="115" r="20" stroke="#333" strokeWidth="4.5" fill="none" />
      <Circle cx="52" cy="115" r="20" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" />
      <Circle cx="52" cy="115" r="3.5" fill="#555" />

      {/* Rear wheel (right) */}
      <Circle cx="52" cy="115" r="0" fill="none" />

      {/* Front wheel */}
      <Circle cx="170" cy="115" r="22" stroke="#333" strokeWidth="5" fill="none" />
      <Circle cx="170" cy="115" r="22" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" />
      <Circle cx="170" cy="115" r="4" fill="#555" />

      {/* Cargo box - rear */}
      <Rect
        x="28"
        y="62"
        width="68"
        height="42"
        rx="6"
        fill="url(#cargoBox)"
        stroke="#ccc"
        strokeWidth="1.5"
      />

      {/* Cargo box lid line */}
      <Path
        d="M32 72 L92 72"
        stroke="#bbb"
        strokeWidth="1"
      />

      {/* Cargo box handle */}
      <Path
        d="M56 62 L56 56 L68 56 L68 62"
        stroke="#999"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cargo box label */}
      <Path
        d="M48 80 L56 80 L52 88 Z"
        fill={color}
        opacity="0.6"
      />

      {/* Frame connecting cargo to front */}
      <Path
        d="M96 100 L140 80 L170 115"
        stroke="#555"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Engine block */}
      <Path
        d="M100 96 L118 86 L128 94 L120 104 L104 104 Z"
        fill="#555"
        stroke="#444"
        strokeWidth="1"
      />

      {/* Fuel tank - compact */}
      <Path
        d="M112 72 C116 64, 130 62, 138 68 L140 78 L114 80 Z"
        fill="url(#triBody)"
        stroke="#34A853"
        strokeWidth="1.5"
      />

      {/* Seat */}
      <Path
        d="M104 68 C106 64, 116 62, 126 64 L128 70 L106 72 Z"
        fill="#2a2a2a"
      />

      {/* Front fork */}
      <Path
        d="M140 72 L160 64 L170 115"
        stroke="#555"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Handlebar - wide for cargo */}
      <Path
        d="M150 58 L172 54"
        stroke="#666"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Path
        d="M154 56 L158 50"
        stroke="#666"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Headlight */}
      <Circle cx="168" cy="64" r="5" fill="#FFF8E1" stroke="#ddd" strokeWidth="1" />
      <Circle cx="168" cy="64" r="3" fill="#FFEB3B" opacity="0.8" />

      {/* Exhaust */}
      <Path
        d="M98 102 L78 108 L72 104"
        stroke="#777"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rear axle */}
      <Path
        d="M32 115 L72 115"
        stroke="#666"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Cargo straps */}
      <Path
        d="M40 62 L40 104"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <Path
        d="M84 62 L84 104"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 3"
        opacity="0.5"
      />
    </Svg>
  );
}
