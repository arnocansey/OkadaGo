import Svg, { Circle, Ellipse, Path, Rect, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
};

/**
 * Express Okada Motorcycle (Yamaha FZ / KTM Duke 200cc Sport Style)
 * Aggressive streetfighter geometry with sculpted fuel tank & aerodynamic shrouds,
 * split stepped seat, underbelly exhaust, gold inverted forks, alloy wheels, and LED lights.
 */
export function ExpressBike({
  width = 200,
  height = 140,
  color = "#ff6b00",
  accentColor = "#1a1a2e"
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 140" fill="none">
      <Defs>
        {/* Sport Tank & Shrouds Gradient */}
        <LinearGradient id="expTankGrad" x1="65" y1="40" x2="135" y2="80">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="60%" stopColor={color} />
          <Stop offset="100%" stopColor="#c2410c" />
        </LinearGradient>

        {/* Gold USD Fork Gradient */}
        <LinearGradient id="usdForkGrad" x1="130" y1="50" x2="160" y2="95">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="50%" stopColor="#f59e0b" />
          <Stop offset="100%" stopColor="#b45309" />
        </LinearGradient>

        {/* Sport Black Seat Gradient */}
        <LinearGradient id="expSeatGrad" x1="50" y1="48" x2="100" y2="48">
          <Stop offset="0%" stopColor="#09090b" />
          <Stop offset="50%" stopColor="#18181b" />
          <Stop offset="100%" stopColor="#0a0a0c" />
        </LinearGradient>
      </Defs>

      {/* Ground Shadow */}
      <Ellipse cx="100" cy="126" rx="78" ry="7" fill="rgba(0,0,0,0.25)" />

      {/* ─── REAR FAT SPORT TIRE & MONOSHOCK ─── */}
      {/* Rear Fat Sport Radial Tire */}
      <Circle cx="42" cy="98" r="27" stroke="#09090b" strokeWidth="9" fill="none" />
      <Circle cx="42" cy="98" r="22" stroke="#18181b" strokeWidth="2" fill="none" />
      {/* Sport 5-Y-Spoke Alloy Wheel */}
      <Circle cx="42" cy="98" r="18" stroke="#374151" strokeWidth="1.5" fill="#0f172a" />
      <Path d="M42 80 L42 116 M24 98 L60 98 M29 85 L55 111 M29 111 L55 85" stroke={color} strokeWidth="2" />
      {/* Rear Disc & Caliper */}
      <Circle cx="42" cy="98" r="10" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
      <Circle cx="42" cy="98" r="6" fill="#1f2937" />
      <Circle cx="42" cy="98" r="2.5" fill="#e5e7eb" />

      {/* Tail Tidy / Minimal Rear Fender */}
      <Path
        d="M26 84 L40 76 L48 76"
        stroke="#18181b"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Slim LED Tail Light */}
      <Path d="M24 81 L30 78" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

      {/* ─── FRONT TIRE & INVERTED FORKS ─── */}
      {/* Front Sport Radial Tire */}
      <Circle cx="158" cy="98" r="27" stroke="#09090b" strokeWidth="9" fill="none" />
      <Circle cx="158" cy="98" r="22" stroke="#18181b" strokeWidth="2" fill="none" />
      {/* Front 5-Y-Spoke Alloy Wheel */}
      <Circle cx="158" cy="98" r="18" stroke="#374151" strokeWidth="1.5" fill="#0f172a" />
      <Path d="M158 80 L158 116 M140 98 L176 98 M145 85 L171 111 M145 111 L171 85" stroke={color} strokeWidth="2" />
      {/* Big Front Petal Disc Brake & Gold Caliper */}
      <Circle cx="158" cy="98" r="13" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeDasharray="3,2" />
      <Rect x="146" y="90" width="6" height="10" rx="2" fill="#eab308" stroke="#a16207" strokeWidth="0.8" />
      <Circle cx="158" cy="98" r="6" fill="#1f2937" />
      <Circle cx="158" cy="98" r="2.5" fill="#e5e7eb" />

      {/* Aerodynamic Front Mudguard */}
      <Path
        d="M136 76 C148 70, 168 70, 178 82"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Gold Inverted USD Front Forks */}
      <Path
        d="M132 52 L158 98"
        stroke="url(#usdForkGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Aluminum Swingarm */}
      <Path
        d="M42 98 L84 88"
        stroke="#475569"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center Monoshock Suspension */}
      <Path d="M72 88 L80 72" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
      <Path d="M72 88 L80 72" stroke="#ffffff" strokeWidth="2" strokeDasharray="2,2" strokeLinecap="round" />

      {/* Trellis / Perimeter Diamond Frame */}
      <Path
        d="M42 98 L78 68 L130 52 L112 90 L78 90 Z"
        stroke="#1e293b"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#0f172a"
      />
      {/* Exposed Trellis Tubes */}
      <Path d="M84 70 L108 90 M98 62 L80 90 M116 56 L100 88" stroke={color} strokeWidth="2" />

      {/* ─── 200CC ENGINE BLOCK & UNDERBELLY EXHAUST ─── */}
      <Path
        d="M78 80 C80 76, 92 74, 104 76 C112 78, 114 86, 110 94 C106 102, 94 106, 82 104 C76 102, 76 90, 78 80 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="1.5"
      />
      {/* Radiator & Engine Fin Details */}
      <Rect x="110" y="68" width="6" height="18" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <Circle cx="90" cy="94" r="7" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <Circle cx="90" cy="94" r="2.5" fill="#f8fafc" />
      {/* Sport Footpeg & Rearset */}
      <Rect x="76" y="98" width="8" height="3" rx="1.5" fill="#94a3b8" />

      {/* Shorty Underbelly Sport Exhaust */}
      <Path
        d="M104 84 C108 92, 106 98, 96 102 L64 104 L52 100"
        stroke="#64748b"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M60 104 L48 99"
        stroke="#e2e8f0"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Carbon Fiber / Orange Exhaust Tip */}
      <Path d="M48 99 L44 98" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ─── SCULPTED SPORT FUEL TANK & TANK SHROUDS ─── */}
      {/* Aggressive Muscular Tank */}
      <Path
        d="M86 52 C90 38, 120 36, 134 46 C138 50, 134 60, 122 62 L88 60 C84 60, 84 56, 86 52 Z"
        fill="url(#expTankGrad)"
        stroke="#0f172a"
        strokeWidth="2"
      />
      {/* Extended Aerodynamic Tank Air Shroud */}
      <Path
        d="M120 50 L138 58 L124 72 L112 62 Z"
        fill={color}
        stroke="#0f172a"
        strokeWidth="1.5"
      />
      {/* Sport Racing Stripe */}
      <Path
        d="M94 42 C108 40, 122 42, 130 48"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Aircraft Style Flush Fuel Cap */}
      <Ellipse cx="112" cy="40" rx="3.5" ry="1.5" fill="#e2e8f0" stroke="#475569" strokeWidth="0.8" />

      {/* ─── STEPPED SPLIT SEAT & SHARP TAIL COWL ─── */}
      {/* Passenger Pillion Stepped Seat */}
      <Path
        d="M48 54 C50 48, 62 46, 70 50 L68 58 L46 58 Z"
        fill="url(#expSeatGrad)"
        stroke="#0f172a"
        strokeWidth="1.5"
      />
      {/* Rider Lower Seat */}
      <Path
        d="M66 58 C70 54, 82 52, 92 56 L88 62 L66 60 Z"
        fill="url(#expSeatGrad)"
        stroke="#0f172a"
        strokeWidth="1.5"
      />
      {/* Sharp Aerodynamic Tail Cowl */}
      <Path
        d="M36 56 L54 50 L52 60 L38 62 Z"
        fill={accentColor}
        stroke="#0f172a"
        strokeWidth="1.5"
      />

      {/* ─── CLIP-ON HANDLEBARS & AGGRESSIVE LED HEADLAMP ─── */}
      {/* Triple Tree */}
      <Path d="M128 48 L132 38" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />

      {/* Low Clip-On Bars with Bar-End Mirror */}
      <Path
        d="M124 36 L136 34 L146 38"
        stroke="#64748b"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M140 36 L146 38" stroke="#09090b" strokeWidth="5" strokeLinecap="round" />
      {/* Bar-End Mirror */}
      <Path d="M146 38 L148 32" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="149" cy="30" r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />

      {/* Sharp Streetfighter LED Headlamp Nacelle */}
      <Path
        d="M144 44 L156 46 L154 56 L144 54 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1.5"
      />
      {/* Twin Angular LED DRL Eyes */}
      <Path d="M148 48 L154 49" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <Path d="M148 52 L153 53" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Small Tinted Windscreen Flyscreen */}
      <Path d="M136 34 L144 28 L146 36 Z" fill="#0f172a" stroke="#475569" strokeWidth="1" opacity="0.9" />
    </Svg>
  );
}
