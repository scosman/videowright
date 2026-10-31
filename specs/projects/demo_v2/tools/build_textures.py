"""Build the Motion Engineering texture PNGs (deterministic). Needs numpy and Pillow.

Usage: python3 build_textures.py packages/lib/skill/assets/styles/motion-engineering/textures
"""
import sys, numpy as np
from PIL import Image
out = sys.argv[1]
# Grain: white speckle in 3px blocks, alpha adds 0..6 levels over the canvas (screen-like,
# barely touches light type). Coarse blocks and no dithering keep PNG frames compressible.
rng = np.random.default_rng(20261031)
blk, n = 3, 86
v = rng.integers(0, 7, (n, n))
v = np.kron(v, np.ones((blk, blk), dtype=int))[:256, :256]
g = np.zeros((256, 256, 4), np.uint8); g[..., 0:3] = 255
g[..., 3] = np.round(v / 245 * 255).astype(np.uint8)
Image.fromarray(g, "RGBA").save(f"{out}/grain.png", optimize=True)
# Vignette: radial-gradient(ellipse 80% 80% at 50% 46%, transparent 38%, rgba(2,4,7,.8) 100%),
# baked without dithering.
W, H = 1920, 1080
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((x - W * 0.5) / (W * 0.8)) ** 2 + ((y - H * 0.46) / (H * 0.8)) ** 2)
t = np.clip((r - 0.38) / 0.62, 0, 1)
vig = np.zeros((H, W, 4), np.uint8); vig[..., 0] = 2; vig[..., 1] = 4; vig[..., 2] = 7
vig[..., 3] = np.round(t * t * (3 - 2 * t) * 0.8 * 255).astype(np.uint8)
Image.fromarray(vig, "RGBA").save(f"{out}/vignette.png", optimize=True)
# Key light: a soft cyan pool, 1400x1000, peak alpha 0.08, smoothstep falloff.
KW, KH = 1400, 1000
y, x = np.mgrid[0:KH, 0:KW].astype(np.float32)
r = np.sqrt(((x - KW / 2) / (KW / 2)) ** 2 + ((y - KH / 2) / (KH / 2)) ** 2)
t = np.clip(1 - r, 0, 1)
key = np.zeros((KH, KW, 4), np.uint8); key[..., 0] = 91; key[..., 1] = 216; key[..., 2] = 245
key[..., 3] = np.round(t * t * (3 - 2 * t) * 0.08 * 255).astype(np.uint8)
Image.fromarray(key, "RGBA").save(f"{out}/key.png", optimize=True)
# Registration crosses for the grid's major intersections (160px tile, arms of 8px), plain and
# lit (the flare). Bitmaps, not SVG data URIs: an SVG background is re-rasterized lazily as the
# grid's scale changes, which made frames differ between renders.
for name, alpha in (("grid-marks", 0.42), ("grid-marks-lit", 0.9)):
    tile = np.zeros((160, 160, 4), np.uint8)
    tile[..., 0], tile[..., 1], tile[..., 2] = 91, 216, 245
    a = np.zeros((160, 160), np.uint8)
    v = round(alpha * 255)
    a[0, 0:8] = v; a[0, 152:160] = v; a[0:8, 0] = v; a[152:160, 0] = v
    tile[..., 3] = a
    Image.fromarray(tile, "RGBA").save(f"{out}/{name}.png", optimize=True)
