"""Copy OkadaGo brand lockups into Expo icon/splash assets.

Delegates to sync-brand-logos.py which syncs logos across the monorepo.
"""

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT / "scripts" / "sync-brand-logos.py"), run_name="__main__")
