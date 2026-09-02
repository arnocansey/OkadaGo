import Svg, { Circle, Ellipse, Path, Rect, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
};

/**
 * Standard Okada Motorcycle (Bajaj Boxer / TVS 150cc Commuter Style)
 * Authentic motorcycle geometry with engine block, cooling fins, heavy tires,
 * teardrop fuel tank, dual-passenger seat, cargo rack, and sweeping exhaust.
 */
export function StandardBike({
  width = 200,
  height = 140,
  color = "#facc15",
  accentColor = "#1b6d3e"
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 140" fill="none">
      <Defs>
        {/* Fuel Tank & Body Gradient */}
        <LinearGradient id="tankGrad" x1="65" y1="45" x2="120" y2="75">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="70%" stopColor={color} />
          <Stop offset="100%" stopColor={accentColor} />
        </LinearGradient>

        {/* Engine Metal Gradient */}
        <LinearGradient id="engineGrad" x1="75" y1="75" x2="105" y2="105">
          <Stop offset="0%" stopColor="#4b5563" />
          <Stop offset="50%" stopColor="#374151" />
          <Stop offset="100%" stopColor="#1f2937" />
        </LinearGradient>

        {/* Chrome Exhaust Gradient */}
        <LinearGradient id="exhaustGrad" x1="60" y1="95" x2="15" y2="105">
          <Stop offset="0%" stopColor="#9ca3af" />
          <Stop offset="50%" stopColor="#e5e7eb" />
          <Stop offset="100%" stopColor="#6b7280" />
        </LinearGradient>

        {/* Seat Texture Gradient */}
        <LinearGradient id="seatGrad" x1="55" y1="52" x2="105" y2="52">
          <Stop offset="0%" stopColor="#18181b" />
          <Stop offset="50%" stopColor="#27272a" />
          <Stop offset="100%" stopColor="#09090b" />
        </LinearGradient>
      </Defs>

      {/* Ground Shadow */}
      <Ellipse cx="98" cy="126" rx="76" ry="7" fill="rgba(0,0,0,0.22)" />

      {/* ─── REAR WHEEL & SUSPENSION ─── */}
      {/* Rear Heavy Tire */}
      <Circle cx="44" cy="100" r="26" stroke="#18181b" strokeWidth="8" fill="none" />
      <Circle cx="44" cy="100" r="22" stroke="#27272a" strokeWidth="2" fill="none" />
      {/* Rear Rim & Spokes */}
      <Circle cx="44" cy="100" r="18" stroke="#d1d5db" strokeWidth="2" fill="#111827" />
      <Path d="M44 82 L44 118 M26 100 L62 100 M31 87 L57 113 M31 113 L57 87" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Rear Sprocket Hub */}
      <Circle cx="44" cy="100" r="7" fill="#4b5563" stroke="#374151" strokeWidth="1.5" />
      <Circle cx="44" cy="100" r="3" fill="#9ca3af" />

      {/* Rear Fender / Mudguard */}
      <Path
        d="M20 95 C22 76, 42 70, 60 74"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rear Tail Light */}
      <Path d="M19 91 L24 93 L23 99 L18 97 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />

      {/* ─── FRONT WHEEL & FORK ─── */}
      {/* Front Heavy Tire */}
      <Circle cx="156" cy="100" r="26" stroke="#18181b" strokeWidth="8" fill="none" />
      <Circle cx="156" cy="100" r="22" stroke="#27272a" strokeWidth="2" fill="none" />
      {/* Front Rim & Spokes */}
      <Circle cx="156" cy="100" r="18" stroke="#d1d5db" strokeWidth="2" fill="#111827" />
      <Path d="M156 82 L156 118 M138 100 L174 100 M143 87 L169 113 M143 113 L169 87" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Front Brake Disc & Hub */}
      <Circle cx="156" cy="100" r="11" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeDasharray="2,2" />
      <Circle cx="156" cy="100" r="6" fill="#4b5563" stroke="#374151" strokeWidth="1.5" />
      <Circle cx="156" cy="100" r="2.5" fill="#e5e7eb" />

      {/* Front Fender / Mudguard */}
      <Path
        d="M136 78 C148 72, 168 74, 176 86"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Front Hydraulic Fork Tubes */}
      <Path
        d="M128 56 L156 100"
        stroke="#9ca3af"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Fork Rubber Boots / Gaiters */}
      <Path
        d="M136 68 L146 84"
        stroke="#111827"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rear Swingarm */}
      <Path
        d="M44 100 L82 92"
        stroke="#374151"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rear Dual Spring Shock */}
      <Path
        d="M50 94 L68 68"
        stroke="#ef4444"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 94 L68 68"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="2,2"
        fill="none"
      />

      {/* Main Motorcycle Chassis Frame */}
      <Path
        d="M44 100 L76 74 L126 56 L108 92 L76 92 Z"
        stroke="#1f2937"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#111827"
      />

      {/* ─── ENGINE BLOCK & CYLINDER ─── */}
      {/* Engine Crankcase */}
      <Path
        d="M74 84 C74 80, 84 76, 96 78 C104 80, 108 86, 106 96 C104 104, 92 108, 80 106 C74 104, 74 94, 74 84 Z"
        fill="url(#engineGrad)"
        stroke="#111827"
        strokeWidth="1.5"
      />
      {/* Engine Cooling Fins */}
      <Rect x="82" y="78" width="18" height="2.5" rx="1" fill="#9ca3af" />
      <Rect x="80" y="83" width="22" height="2.5" rx="1" fill="#9ca3af" />
      <Rect x="80" y="88" width="22" height="2.5" rx="1" fill="#9ca3af" />
      <Rect x="82" y="93" width="18" height="2.5" rx="1" fill="#9ca3af" />
      {/* Circular Engine Clutch Cover */}
      <Circle cx="86" cy="98" r="6" fill="#6b7280" stroke="#374151" strokeWidth="1" />
      <Circle cx="86" cy="98" r="2" fill="#e5e7eb" />
      {/* Rider Footpeg */}
      <Rect x="80" y="103" width="8" height="3" rx="1.5" fill="#111827" />

      {/* ─── EXHAUST SYSTEM ─── */}
      {/* Exhaust Header Pipe */}
      <Path
        d="M102 84 C108 90, 108 98, 98 103 L48 105 L26 100"
        stroke="url(#exhaustGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Exhaust Muffler Chrome Heat Shield */}
      <Path
        d="M62 104 L26 99"
        stroke="#f3f4f6"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M25 99 L21 98.5"
        stroke="#111827"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Side Tool/Battery Cover */}
      <Path
        d="M68 70 L90 68 L88 82 L66 80 Z"
        fill={accentColor}
        stroke="#111827"
        strokeWidth="1"
      />

      {/* ─── FUEL TANK ─── */}
      <Path
        d="M84 56 C88 44, 114 42, 126 50 C129 53, 128 62, 118 64 L86 64 C82 64, 82 59, 84 56 Z"
        fill="url(#tankGrad)"
        stroke="#111827"
        strokeWidth="2"
      />
      {/* Tank Center Accent Stripe */}
      <Path
        d="M92 48 C104 46, 116 48, 122 52"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Chrome Fuel Cap */}
      <Ellipse cx="106" cy="46" rx="4" ry="1.5" fill="#f3f4f6" stroke="#4b5563" strokeWidth="0.8" />

      {/* ─── LONG DUAL SEAT ─── */}
      <Path
        d="M48 60 C52 50, 76 50, 92 53 C94 57, 92 63, 86 64 L50 63 C46 63, 46 61, 48 60 Z"
        fill="url(#seatGrad)"
        stroke="#111827"
        strokeWidth="1.5"
      />
      {/* Seat Stitching Lines */}
      <Path d="M58 52 L57 62 M68 51 L67 62 M78 52 L77 63" stroke="#3f3f46" strokeWidth="1" />

      {/* Heavy-Duty Rear Luggage / Cargo Rack */}
      <Path
        d="M32 60 L48 60 M34 60 L38 68 M42 60 L44 68 M30 58 L32 64"
        stroke="#d1d5db"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── HANDLEBARS, CONTROLS & HEADLIGHT ─── */}
      {/* Triple Tree / Headstock */}
      <Path d="M124 54 L129 44" stroke="#374151" strokeWidth="5" strokeLinecap="round" />

      {/* Chrome Handlebars with Grips */}
      <Path
        d="M120 40 L134 38 L142 42"
        stroke="#9ca3af"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Rubber Grip */}
      <Path d="M138 40 L142 42" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
      {/* Rear View Mirror */}
      <Path d="M124 39 L122 30" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="121" cy="28" r="3.5" fill="#e5e7eb" stroke="#374151" strokeWidth="1" />

      {/* Front Round Halogen Headlight */}
      <Path
        d="M142 50 C146 48, 150 50, 151 54 C152 58, 148 62, 144 62 Z"
        fill="#111827"
        stroke="#374151"
        strokeWidth="1"
      />
      <Ellipse cx="149" cy="56" rx="2.5" ry="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      {/* Amber Front Turn Signal */}
      <Circle cx="138" cy="58" r="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
    </Svg>
  );
}
