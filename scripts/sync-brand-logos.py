"""Sync OkadaGo lockup logos into branding mirrors, Expo icons, and splash assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    r"C:\Users\arnoc\.cursor\projects\c-Users-arnoc-Desktop-WebsiteProjects2026-OkadaGo\assets"
)

SRC = {
    "light": ASSETS
    / "c__Users_arnoc_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_light_mode-9e0f589b-d5ed-48ec-badd-b917233cf173.png",
    "passenger": ASSETS
    / "c__Users_arnoc_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_darkmode_passenger-1a64e617-f213-4273-8c0c-d9b941620177.png",
    "rider": ASSETS
    / "c__Users_arnoc_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_darkmode_rider-f9933668-6eae-426d-8285-db740950fdf1.png",
}

PASSENGER_NAVY = (26, 46, 76, 255)  # #1A2E4C
RIDER_ORANGE = (255, 107, 0, 255)  # #FF6B00
LIGHT_BG = (242, 242, 242, 255)

LOGO_DIRS = [
    ROOT / "branding" / "logos",
    ROOT / "okada-ui" / "public" / "branding",
    ROOT / "frontend" / "admin-app" / "public" / "branding",
    ROOT / "frontend" / "passenger-app" / "assets" / "branding",
    ROOT / "frontend" / "rider-app" / "assets" / "branding",
]


def square_pad(img: Image.Image, fill: tuple[int, int, int, int], size: int = 1024) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), fill)
    src = img.convert("RGBA")
    # Fit artwork inside square with modest padding.
    max_side = int(size * 0.86)
    ratio = min(max_side / src.width, max_side / src.height)
    w = max(1, int(src.width * ratio))
    h = max(1, int(src.height * ratio))
    resized = src.resize((w, h), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - w) // 2, (size - h) // 2), resized)
    return canvas


def adaptive_foreground(lockup: Image.Image, size: int = 1024) -> Image.Image:
    """Transparent FG with artwork inset into Android adaptive safe zone."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    src = lockup.convert("RGBA")
    safe = int(size * 0.72)
    ratio = min(safe / src.width, safe / src.height)
    w = max(1, int(src.width * ratio))
    h = max(1, int(src.height * ratio))
    resized = src.resize((w, h), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - w) // 2, (size - h) // 2), resized)
    return canvas


def main() -> None:
    for key, path in SRC.items():
        if not path.exists():
            raise SystemExit(f"Missing source logo: {path}")

    light = Image.open(SRC["light"]).convert("RGBA")
    passenger = Image.open(SRC["passenger"]).convert("RGBA")
    rider = Image.open(SRC["rider"]).convert("RGBA")

    named = {
        "okadago-lockup-light.png": light,
        "okadago-lockup-dark-passenger.png": passenger,
        "okadago-lockup-dark-rider.png": rider,
        # Compatibility aliases used by older BrandMark paths during transition.
        "okadago-wordmark-dark.png": light,
        "okadago-wordmark-light.png": passenger,
        "okadago-icon-dark.png": square_pad(light, LIGHT_BG),
        "okadago-icon-yellow.png": square_pad(rider, RIDER_ORANGE),
    }

    for folder in LOGO_DIRS:
        folder.mkdir(parents=True, exist_ok=True)
        for name, img in named.items():
            out = folder / name
            img.save(out, "PNG")
            print(f"wrote {out}")

    # Passenger Expo icons/splash (navy)
    passenger_assets = ROOT / "frontend" / "passenger-app" / "assets"
    passenger_assets.mkdir(parents=True, exist_ok=True)
    square_pad(passenger, PASSENGER_NAVY).save(passenger_assets / "icon.png", "PNG")
    adaptive_foreground(passenger).save(passenger_assets / "adaptive-icon.png", "PNG")
    square_pad(passenger, PASSENGER_NAVY).save(passenger_assets / "splash-icon.png", "PNG")
    print(f"updated passenger icons in {passenger_assets}")

    # Rider Expo icons/splash (orange)
    rider_assets = ROOT / "frontend" / "rider-app" / "assets"
    rider_assets.mkdir(parents=True, exist_ok=True)
    square_pad(rider, RIDER_ORANGE).save(rider_assets / "icon.png", "PNG")
    adaptive_foreground(rider).save(rider_assets / "adaptive-icon.png", "PNG")
    square_pad(rider, RIDER_ORANGE).save(rider_assets / "splash-icon.png", "PNG")
    print(f"updated rider icons in {rider_assets}")


if __name__ == "__main__":
    main()
