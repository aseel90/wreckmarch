from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'assets' / 'hero' / 'shotgun'
OUT_DIR = SRC_DIR / 'generated-wrecker'
OUT_DIR.mkdir(parents=True, exist_ok=True)

RUN_SRC = SRC_DIR / 'Gemini_Generated_Image_cky2bmcky2bmcky2.jfif'
IDLE_SRC = SRC_DIR / 'Gemini_Generated_Image_o8s2kto8s2kto8s2.jfif'
CANVAS = (128, 148)
FOOTLINE = 140


def checker_distance(rgb):
    # Gemini checkerboards are near-neutral light greys. Distance to neutral grey
    # plus saturation separates character pixels from the checker pattern.
    arr = rgb.astype(np.int16)
    mx = arr.max(axis=2)
    mn = arr.min(axis=2)
    sat = mx - mn
    lum = arr.mean(axis=2)
    neutral_bg = (sat < 16) & (lum > 150)
    return ~neutral_bg


def largest_components(mask, expected):
    # Project to x and find broad character bands; robust to disconnected limbs.
    col = mask.sum(axis=0)
    active = col > max(3, mask.shape[0] * 0.015)
    spans = []
    start = None
    for i, v in enumerate(active):
        if v and start is None:
            start = i
        elif not v and start is not None:
            spans.append([start, i - 1])
            start = None
    if start is not None:
        spans.append([start, len(active) - 1])

    # Merge nearby spans belonging to one character.
    merged = []
    gap_limit = max(12, mask.shape[1] // (expected * 12))
    for s in spans:
        if not merged or s[0] - merged[-1][1] > gap_limit:
            merged.append(s)
        else:
            merged[-1][1] = s[1]

    # If segmentation is noisy, fall back to equal horizontal cells.
    if len(merged) != expected:
        w = mask.shape[1]
        cell = w / expected
        merged = [[round(i * cell), round((i + 1) * cell) - 1] for i in range(expected)]
    return merged


def crop_character(src, x0, x1, remove_shadow=False):
    rgb = np.array(src.convert('RGB'))
    local = rgb[:, x0:x1 + 1]
    fg = checker_distance(local)

    # Remove the faint horizontal/generated floor shadow only in run art.
    # Keep dark boot pixels by limiting cleanup to low-saturation near-floor pixels.
    if remove_shadow:
        h = local.shape[0]
        yy = np.arange(h)[:, None]
        arr = local.astype(np.int16)
        sat = arr.max(axis=2) - arr.min(axis=2)
        lum = arr.mean(axis=2)
        floor_shadow = (yy > h * 0.88) & (sat < 24) & (lum > 70) & (lum < 185)
        fg &= ~floor_shadow

    ys, xs = np.where(fg)
    if len(xs) == 0:
        raise RuntimeError('No foreground detected')
    # trim outliers from JPEG noise
    left, right = np.percentile(xs, [0.15, 99.85]).astype(int)
    top, bottom = np.percentile(ys, [0.15, 99.85]).astype(int)
    left = max(0, left - 3); right = min(local.shape[1] - 1, right + 3)
    top = max(0, top - 3); bottom = min(local.shape[0] - 1, bottom + 3)

    crop = local[top:bottom + 1, left:right + 1]
    alpha_mask = fg[top:bottom + 1, left:right + 1]
    # Feather only one pixel at boundary; preserve crisp art.
    alpha = (alpha_mask.astype(np.uint8) * 255)
    rgba = np.dstack([crop, alpha])
    return Image.fromarray(rgba, 'RGBA')


def fit_to_canvas(img):
    # Preserve proportions. Target body envelope ~104x132 inside frozen 128x148 canvas.
    max_w, max_h = 108, 132
    scale = min(max_w / img.width, max_h / img.height)
    nw = max(1, round(img.width * scale)); nh = max(1, round(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    x = (CANVAS[0] - nw) // 2
    y = FOOTLINE - nh
    canvas.alpha_composite(resized, (x, y))
    return canvas


def process(path, count, prefix, remove_shadow=False):
    src = Image.open(path).convert('RGB')
    mask = checker_distance(np.array(src))
    spans = largest_components(mask, count)
    for i, (x0, x1) in enumerate(spans):
        frame = fit_to_canvas(crop_character(src, x0, x1, remove_shadow=remove_shadow))
        frame.save(OUT_DIR / f'{prefix}-{i}.png', optimize=True)
    return spans, src.size


def make_preview():
    names = ['idle-0','idle-1'] + [f'run-{i}' for i in range(5)]
    preview = Image.new('RGBA', (CANVAS[0] * len(names), CANVAS[1]), (38, 38, 38, 255))
    for i, name in enumerate(names):
        im = Image.open(OUT_DIR / f'{name}.png').convert('RGBA')
        preview.alpha_composite(im, (i * CANVAS[0], 0))
    preview.save(OUT_DIR / 'preview.png', optimize=True)


if __name__ == '__main__':
    if not RUN_SRC.exists() or not IDLE_SRC.exists():
        raise SystemExit(f'Missing source art: {RUN_SRC} or {IDLE_SRC}')
    idle_spans, idle_size = process(IDLE_SRC, 2, 'idle', remove_shadow=False)
    run_spans, run_size = process(RUN_SRC, 5, 'run', remove_shadow=True)
    make_preview()
    print({'idle_source': idle_size, 'idle_spans': idle_spans, 'run_source': run_size, 'run_spans': run_spans})
