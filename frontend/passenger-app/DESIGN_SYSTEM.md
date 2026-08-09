# OkadaGo Design System

A motorcycle-first, map-dominant mobile UX system built for African ride-hailing.

---

## Core Principles

1. **Map is King** — Always visually dominant (62% of viewport minimum)
2. **Bottom Sheets for Actions** — Not full screens; map stays visible
3. **One Focal Point Per Screen** — Never compete for attention
4. **Asymmetric > Generic** — Intentional asymmetry, not broken symmetry
5. **Thumb Zone CTAs** — Primary actions in bottom 25% for one-handed use
6. **Accent for Status Only** — Gold/orange for CTAs and status, not decoration

---

## Viewport

| Property | Value | Notes |
|----------|-------|-------|
| Width | 390px | iPhone 14 Pro standard |
| Height | 844px | Standard notch height |
| Status Bar | 44px | Fixed header |
| Safe Top | 59px | iOS / 44px Android |
| Safe Bottom | 34px | iOS / 20px Android |

---

## Spacing (8px Grid)

All spacing uses an 8px base grid. Use these tokens, never raw numbers.

```typescript
space[1]  = 4px    // micro
space[2]  = 8px    // xs
space[3]  = 12px   // sm
space[4]  = 16px   // md (standard margin)
space[5]  = 20px   // lg
space[6]  = 24px   // xl
space[8]  = 32px   // 2xl
space[10] = 40px   // 3xl
space[12] = 48px   // 4xl
space[16] = 64px   // 5xl
space[20] = 80px   // 6xl
```

---

## Colors

### Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#facc15` | Gold — primary CTA, status indicators |
| `primaryDark` | `#f7c600` | Darker gold for hover/pressed |
| `accent` | `#ff6b00` | Orange — secondary accent, route color |
| `accentDark` | `#e05e00` | Darker orange |
| `danger` | `#FF3B30` | Red — errors, cancellations |
| `success` | `#4CD964` | Green — confirmations, online status |
| `info` | `#0A84FF` | Blue — informational |
| `warning` | `#facc15` | Gold — warnings |

### Dark Theme (Default)

| Token | Hex | Description |
|-------|-----|-------------|
| `background` | `#0B0F19` | App background |
| `bg` | `#070B14` | Deep background |
| `surface` | `#151C2C` | Card backgrounds |
| `surfaceElevated` | `#1C2538` | Elevated surfaces |
| `surfaceRaised` | `#1C2538` | Raised cards |
| `surfaceOverlay` | `rgba(255,255,255,0.05)` | Glass/overlay |
| `border` | `#252D39` | Subtle borders |
| `borderStrong` | `#344052` | Emphasized borders |
| `text` | `#FFFFFF` | Primary text |
| `textSecondary` | `#A1A1AA` | Secondary text |
| `textMuted` | `#71717A` | Muted/caption text |
| `overlay` | `rgba(0,0,0,0.6)` | Modal overlays |

### Light Theme

| Token | Hex | Description |
|-------|-----|-------------|
| `background` | `#FFFFFF` | App background |
| `bg` | `#FFFFFF` | Deep background |
| `surface` | `#F2F2F7` | Card backgrounds |
| `surfaceElevated` | `#FFFFFF` | Elevated surfaces |
| `surfaceRaised` | `#FFFFFF` | Raised cards |
| `surfaceOverlay` | `rgba(0,0,0,0.03)` | Glass/overlay |
| `border` | `#E5E5EA` | Subtle borders |
| `borderStrong` | `#C7C7CC` | Emphasized borders |
| `text` | `#000000` | Primary text |
| `textSecondary` | `#636366` | Secondary text |
| `textMuted` | `#8E8E93` | Muted/caption text |
| `overlay` | `rgba(0,0,0,0.6)` | Modal overlays |

---

## Border Radii

```typescript
radii.none   = 0
radii.sm     = 6px     // Small buttons, badges
radii.md     = 8px     // Standard cards
radii.card   = 12px    // Card corners
radii.lg     = 16px    // Large cards
radii.xl     = 20px    // Bottom sheets
radii.pill   = 9999px  // Pills, badges
radii.circle = 9999px  // Circular
```

---

## Typography

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `micro` | 10px | Badges, fine print |
| `caption` | 12px | Captions, labels |
| `bodySmall` | 13px | Secondary body |
| `body` | 15px | Standard body |
| `bodyEmphasis` | 15px | Emphasized body |
| `callout` | 16px | Callouts |
| `subhead` | 17px | Subheadings |
| `title` | 20px | Section titles |
| `headline` | 24px | Headlines |
| `largeTitle` | 34px | Hero titles |

### Font Weights

| Token | Value |
|-------|-------|
| `regular` | "400" |
| `medium` | "500" |
| `semibold` | "600" |
| `bold` | "700" |

---

## Shadows

```typescript
shadows.sm    // Subtle elevation (cards)
shadows.md    // Medium elevation (sheets)
shadows.lg    // High elevation (modals)
shadows.glow  // Gold glow for CTAs
```

---

## Timing (Animation Durations)

```typescript
timing.fast    = 150ms  // Micro-interactions
timing.normal  = 250ms  // Standard transitions
.timing.slow   = 400ms  // Page transitions
```

---

## Z-Index Layers

```typescript
z.base        = 0       // Default content
z.card        = 10      // Cards, sheets
z.overlay     = 100     // Overlays
z.modal       = 200     // Modals
z.floating    = 300     // Floating elements
z.statusBar   = 400     // Status bar
z.tooltip     = 500     // Tooltips
```

---

## Components

### Core Primitives

| Component | Purpose | Location |
|-----------|---------|----------|
| `OkadaSheet` | Primary bottom sheet | `src/components/ui/OkadaSheet.tsx` |
| `ThumbButton` | Primary CTA (thumb zone) | `src/components/ui/ThumbButton.tsx` |
| `AsymmetricCard` | Signature asymmetric card | `src/components/ui/AsymmetricCard.tsx` |
| `MapOverlay` | Map overlay + FloatingPill | `src/components/ui/MapOverlay.tsx` |
| `StatPill` | Compact stat display | `src/components/ui/StatPill.tsx` |
| `DestinationPill` | "Where to?" trigger | `src/components/ui/DestinationPill.tsx` |
| `QuickAction` | Saved place quick action | `src/components/ui/QuickAction.tsx` |
| `SearchOverlay` | Full-screen search | `src/components/ui/SearchOverlay.tsx` |

### Feature Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RideOptionCard` | Motorcycle-first ride selection | `src/components/RideOptionCard.tsx` |
| `RiderTransparencyCard` | Rider match explanation | `src/components/RiderTransparencyCard.tsx` |
| `BookingSheet` | Ride selection bottom sheet | `src/components/BookingSheet.tsx` |
| `AddressAutocompleteField` | Place search input | `src/components/AddressAutocompleteField.tsx` |

### Vehicle Illustrations

| Component | Vehicle | Location |
|-----------|---------|----------|
| `StandardBike` | Standard motorcycle | `src/components/vehicles/StandardBike.tsx` |
| `ExpressBike` | Express motorcycle | `src/components/vehicles/ExpressBike.tsx` |
| `CargoTrike` | Cargo tricycle | `src/components/vehicles/CargoTrike.tsx` |

---

## Layout Patterns

### Map-Dominant Home
```
┌─────────────────────────────┐
│ [Status Bar 44px]           │
├─────────────────────────────┤
│                             │
│      MAP (62%+)             │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │  OkadaSheet (Bottom)    ││
│  │  - DestinationPill      ││
│  │  - Service Chips        ││
│  │  - Saved Places Grid    ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Booking Flow
```
┌─────────────────────────────┐
│ [Status Bar 44px]           │
├─────────────────────────────┤
│                             │
│      MAP (40%)              │
│                             │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │  BookingSheet (60%)     ││
│  │  - RideOptionCard(s)    ││
│  │  - ThumbButton (CTA)    ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Search Flow
```
┌─────────────────────────────┐
│ [Status Bar 44px]           │
├─────────────────────────────┤
│  [Back] [Search Input]      │ ← Full width, autoFocus
├─────────────────────────────┤
│                             │
│  Saved Places (vertical)    │
│  - QuickAction cards        │
│                             │
│  Recent Searches            │
│  - List items               │
│                             │
└─────────────────────────────┘
```

---

## Usage Examples

### Using Design Tokens

```tsx
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type, shadows, timing } from "@/theme/design-system";

function MyComponent() {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{
      padding: space[4],           // 16px
      borderRadius: radii.card,    // 12px
      backgroundColor: isDark ? colors.surface : "#FFFFFF",
      ...shadows.md,
    }}>
      <Text style={{
        ...type.title,
        color: colors.text,
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

### Using OkadaSheet

```tsx
import { OkadaSheet, ThumbButton } from "@/components/ui";
import { space } from "@/theme/design-system";

function BookingScreen() {
  return (
    <OkadaSheet style={{ maxHeight: "60%" }}>
      <Text style={type.headline}>Choose your ride</Text>
      
      {/* Ride options */}
      
      <ThumbButton
        label="Confirm ride"
        onPress={handleConfirm}
        icon={<Text>🏍️</Text>}
      />
    </OkadaSheet>
  );
}
```

### Using AsymmetricCard

```tsx
import { AsymmetricCard } from "@/components/ui";
import { space } from "@/theme/design-system";

function SavedPlace() {
  return (
    <AsymmetricCard
      offset={-8}
      onPress={handlePress}
      style={{ flex: 1 }}
    >
      <MapPin size={20} color={colors.primary} />
      <Text style={type.bodyEmphasis}>Home</Text>
      <Text style={type.caption}>123 Main St</Text>
    </AsymmetricCard>
  );
}
```

---

## Do's and Don'ts

### ✅ Do
- Use `space[]` tokens for all spacing
- Use `type` tokens for all typography
- Use `colors` from `useTheme()` for all colors
- Keep map visually dominant
- Place primary CTAs in thumb zone (bottom 25%)
- Use bottom sheets for actions
- Show motorcycle illustrations as heroes

### ❌ Don't
- Use raw pixel values (e.g., `padding: 16`)
- Use `colors.surface` for raised elements (use `surfaceRaised`)
- Use `colors.background` for deep bg (use `bg`)
- Center everything symmetrically
- Hide the map behind full-screen modals
- Use accent color for decoration
- Create generic card layouts

---

## File Structure

```
src/
├── theme/
│   ├── design-system.ts      # Design tokens & primitives
│   └── tokens.ts             # Theme colors & typography
├── components/
│   ├── ui/                   # Core UI primitives
│   │   ├── OkadaSheet.tsx
│   │   ├── ThumbButton.tsx
│   │   ├── AsymmetricCard.tsx
│   │   ├── MapOverlay.tsx
│   │   ├── StatPill.tsx
│   │   ├── DestinationPill.tsx
│   │   ├── QuickAction.tsx
│   │   └── SearchOverlay.tsx
│   ├── vehicles/             # Motorcycle illustrations
│   │   ├── StandardBike.tsx
│   │   ├── ExpressBike.tsx
│   │   └── CargoTrike.tsx
│   ├── BookingSheet.tsx
│   ├── RideOptionCard.tsx
│   └── RiderTransparencyCard.tsx
└── context/
    └── ThemeContext.tsx       # Theme provider
```
