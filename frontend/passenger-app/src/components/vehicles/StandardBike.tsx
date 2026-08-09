import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
};

export function StandardBike({ width = 200, height = 140, color = "#facc15", accentColor = "#1b6d3e" }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 140" fill="none">
      <Defs>
        <LinearGradient id="stdBody" x1="60" y1="50" x2="140" y2="100">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={accentColor} />
        </LinearGradient>
        <LinearGradient id="stdSeat" x1="70" y1="55" x2="120" y2="55">
          <Stop offset="0%" stopColor="#2A2400" />
          <Stop offset="100%" stopColor="#1a1700" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="100" cy="128" rx="70" ry="6" fill="rgba(0,0,0,0.15)" />

      {/* Rear wheel */}
      <Circle cx="52" cy="108" r="24" stroke="#333" strokeWidth="5" fill="none" />
      <Circle cx="52" cy="108" r="24" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
      <Circle cx="52" cy="108" r="4" fill="#555" />
      <Circle cx="52" cy="108" r="2" fill="#888" />

      {/* Front wheel */}
      <Circle cx="152" cy="108" r="24" stroke="#333" strokeWidth="5" fill="none" />
      <Circle cx="152" cy="108" r="24" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
      <Circle cx="152" cy="108" r="4" fill="#555" />
      <Circle cx="152" cy="108" r="2" fill="#888" />

      {/* Frame */}
      <Path
        d="M52 108 L80 70 L110 70 L152 108"
        stroke="#444"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Engine block */}
      <Path
        d="M72 90 L90 80 L100 90 L88 98 L72 98 Z"
        fill="#555"
        stroke="#444"
        strokeWidth="1"
      />

      {/* Fuel tank */}
      <Path
        d="M78 62 C82 54, 100 52, 108 58 L110 70 L80 70 Z"
        fill="url(#stdBody)"
        stroke={accentColor}
        strokeWidth="1.5"
      />

      {/* Seat */}
      <Path
        d="M70 60 C72 56, 82 54, 92 56 L94 62 L72 64 Z"
        fill="url(#stdSeat)"
      />

      {/* Front fork */}
      <Path
        d="M110 70 L140 60 L152 108"
        stroke="#555"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Handlebar */}
      <Path
        d="M132 56 L148 52"
        stroke="#666"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M136 54 L140 48"
        stroke="#666"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Headlight */}
      <Circle cx="148" cy="62" r="5" fill="#FFF8E1" stroke="#ddd" strokeWidth="1" />
      <Circle cx="148" cy="62" r="3" fill="#FFEB3B" opacity="0.8" />

      {/* Exhaust pipe */}
      <Path
        d="M68 96 L48 100 L42 96"
        stroke="#777"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rear fender */}
      <Path
        d="M36 92 C40 84, 60 84, 68 92"
        stroke="#555"
        strokeWidth="2"
        fill="none"
      />

      {/* Kickstand */}
      <Path
        d="M82 98 L78 118"
        stroke="#666"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
