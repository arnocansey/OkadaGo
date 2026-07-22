"""Copy OkadaGo brand mark into Expo icon/splash assets for passenger + rider apps."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "branding" / "logos" / "okadago-icon-yellow.png"

TARGETS = [
    ROOT / "frontend" / "passenger-app" / "assets",
    ROOT / "frontend" / "rider-app" / "assets",
]


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    size = 1024

    icon = src.resize((size, size), Image.Resampling.LANCZOS)

    # Adaptive foreground: keep artwork inside Android safe zone (~66%).
    safe = int(size * 0.72)
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = src.resize((safe, safe), Image.Resampling.LANCZOS)
    fg.paste(inset, ((size - safe) // 2, (size - safe) // 2), inset)

    # Splash: brand mark centered on black.
    splash = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    splash_mark = src.resize((640, 640), Image.Resampling.LANCZOS)
    splash.paste(splash_mark, ((size - 640) // 2, (size - 640) // 2), splash_mark)

    for base in TARGETS:
        base.mkdir(parents=True, exist_ok=True)
        icon.save(base / "icon.png", "PNG")
        fg.save(base / "adaptive-icon.png", "PNG")
        splash.save(base / "splash-icon.png", "PNG")
        print(f"updated {base}")


if __name__ == "__main__":
    main()
