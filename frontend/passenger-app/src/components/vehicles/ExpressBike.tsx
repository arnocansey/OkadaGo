import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
};

export function ExpressBike({ width = 200, height = 140, color = "#ff6b00", accentColor = "#1a1a2e" }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 140" fill="none">
      <Defs>
        <LinearGradient id="expBody" x1="60" y1="45" x2="145" y2="95">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#e05e00" />
        </LinearGradient>
        <LinearGradient id="expSeat" x1="65" y1="50" x2="115" y2="50">
          <Stop offset="0%" stopColor="#0a0a14" />
          <Stop offset="100%" stopColor="#1a1a2e" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="100" cy="128" rx="72" ry="6" fill="rgba(0,0,0,0.18)" />

      {/* Rear wheel */}
      <Circle cx="48" cy="108" r="25" stroke="#222" strokeWidth="5" fill="none" />
      <Circle cx="48" cy="108" r="25" stroke={color} strokeWidth="2" fill="none" opacity="0.4" />
      <Circle cx="48" cy="108" r="5" fill="#444" />
      <Circle cx="48" cy="108" r="2.5" fill="#999" />

      {/* Front wheel */}
      <Circle cx="156" cy="108" r="25" stroke="#222" strokeWidth="5" fill="none" />
      <Circle cx="156" cy="108" r="25" stroke={color} strokeWidth="2" fill="none" opacity="0.4" />
      <Circle cx="156" cy="108" r="5" fill="#444" />
      <Circle cx="156" cy="108" r="2.5" fill="#999" />

      {/* Swingarm */}
      <Path
        d="M48 108 L85 85"
        stroke="#444"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Frame - sportier geometry */}
      <Path
        d="M48 108 L78 65 L115 60 L156 108"
        stroke="#333"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Engine block - more angular */}
      <Path
        d="M68 92 L92 78 L105 88 L100 100 L72 100 Z"
        fill="#444"
        stroke="#333"
        strokeWidth="1"
      />

      {/* Fuel tank - aggressive sport shape */}
      <Path
        d="M76 58 C80 48, 102 44, 115 52 L118 62 L80 64 Z"
        fill="url(#expBody)"
        stroke="#e05e00"
        strokeWidth="1.5"
      />

      {/* Racing stripe */}
      <Path
        d="M84 52 L108 48"
        stroke="#FFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Seat - sport single seat */}
      <Path
        d="M68 56 C70 52, 80 50, 90 52 L92 58 L70 60 Z"
        fill="url(#expSeat)"
      />

      {/* Rear cowl */}
      <Path
        d="M60 58 L68 54 L72 60 L62 64 Z"
        fill={accentColor}
      />

      {/* Front fork - inverted (sport style) */}
      <Path
        d="M118 60 L144 52 L156 108"
        stroke="#555"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clip-on handlebars */}
      <Path
        d="M136 48 L152 44"
        stroke="#666"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M140 46 L144 40"
        stroke="#666"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* LED headlight - aggressive */}
      <Path
        d="M150 56 L160 54 L158 62 L148 64 Z"
        fill="#FFF8E1"
        stroke="#ddd"
        strokeWidth="1"
      />
      <Path
        d="M152 58 L158 56 L157 62 L151 63 Z"
        fill="#FFEB3B"
        opacity="0.9"
      />

      {/* Exhaust - underbelly sport exhaust */}
      <Path
        d="M64 98 L44 104 L38 100"
        stroke="#666"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M38 100 L34 98"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Rear fender - minimal */}
      <Path
        d="M32 90 C36 82, 58 82, 64 90"
        stroke="#444"
        strokeWidth="2"
        fill="none"
      />

      {/* Speed lines for dynamism */}
      <Path d="M10 70 L24 70" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <Path d="M6 78 L22 78" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <Path d="M12 86 L26 86" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </Svg>
  );
}
