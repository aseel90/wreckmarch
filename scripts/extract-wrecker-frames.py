from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'assets' / 'hero' / 'shotgun'
OUT_DIR = SRC_DIR / 'generated-wrecker'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Source-sheet identity is determined by the actual approved sheet layout:
# cky2 = 2912x1440, two-character idle sheet; o8s2 = 4640x928, five-character run sheet.
IDLE_SRC = SRC_DIR / 'Gemini_Generated_Image_cky2bmcky2bmcky2.jfif'
RUN_SRC = SRC_DIR / 'Gemini_Generated_Image_o8s2kto8s2kto8s2.jfif'
CANVAS = (128, 148)
FOOTLINE = 140


def equal_cells(width, count):
    edges = np.linspace(0, width, count + 1).round().astype(int)
    return [(int(edges[i]), int(edges[i + 1])) for i in range(count)]


def isolate_character(cell_rgb):
    """GrabCut one character from its checkerboard cell and keep only its body component."""
    bgr = cv2.cvtColor(cell_rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    mx = max(2, round(w * 0.025))
    my = max(2, round(h * 0.02))
    rect = (mx, my, max(1, w - 2 * mx), max(1, h - 2 * my))
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, rect, bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Join antialiased body details, then discard detached floor/shadow/noise components.
    kernel = np.ones((3, 3), np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=1)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n <= 1:
        raise RuntimeError('No foreground component detected')
    candidates = []
    for idx in range(1, n):
        x, y, cw, ch, area = stats[idx]
        score = area * (1.0 + min(ch / max(1, h), 0.8))
        if ch > h * 0.25 and cw > w * 0.08:
            candidates.append((score, idx))
    idx = max(candidates)[1] if candidates else 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    body = (labels == idx).astype(np.uint8) * 255

    # Preserve fine edge pixels adjacent to the selected body, but not detached floor shadow.
    dilated = cv2.dilate(body, kernel, iterations=1)
    body = cv2.bitwise_and(fg, dilated)
    ys, xs = np.where(body > 0)
    if not len(xs):
        raise RuntimeError('Foreground body became empty')
    x0, x1 = max(0, xs.min() - 2), min(w - 1, xs.max() + 2)
    y0, y1 = max(0, ys.min() - 2), min(h - 1, ys.max() + 2)

    rgba = np.dstack([cell_rgb, body])[y0:y1 + 1, x0:x1 + 1]
    return Image.fromarray(rgba, 'RGBA'), {'bbox': [int(x0), int(y0), int(x1), int(y1)], 'sourceCell': [w, h]}


def fit_to_canvas(img):
    max_w, max_h = 108, 132
    scale = min(max_w / img.width, max_h / img.height)
    nw = max(1, round(img.width * scale))
    nh = max(1, round(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    x = (CANVAS[0] - nw) // 2
    y = FOOTLINE - nh
    canvas.alpha_composite(resized, (x, y))
    return canvas, {'outputBody': [nw, nh], 'offset': [x, y]}


def process(path, count, prefix):
    src = Image.open(path).convert('RGB')
    arr = np.array(src)
    spans = equal_cells(src.width, count)
    records = []
    for i, (x0, x1) in enumerate(spans):
        pad = max(0, round((x1 - x0) * 0.01))
        cell = arr[:, x0 + pad:x1 - pad]
        isolated, seg = isolate_character(cell)
        frame, fit = fit_to_canvas(isolated)
        out = OUT_DIR / f'{prefix}-{i}.png'
        frame.save(out, optimize=True)
        records.append({'frame': f'{prefix}-{i}', 'cellX': [x0 + pad, x1 - pad], **seg, **fit})
    return {'source': path.name, 'sourceSize': list(src.size), 'frames': records}


def make_preview():
    names = ['idle-0', 'idle-1'] + [f'run-{i}' for i in range(5)]
    preview = Image.new('RGBA', (CANVAS[0] * len(names), CANVAS[1]), (38, 38, 38, 255))
    for i, name in enumerate(names):
        preview.alpha_composite(Image.open(OUT_DIR / f'{name}.png').convert('RGBA'), (i * CANVAS[0], 0))
    preview.save(OUT_DIR / 'preview.png', optimize=True)


if __name__ == '__main__':
    if not RUN_SRC.exists() or not IDLE_SRC.exists():
        raise SystemExit('Missing approved high-resolution Wrecker source art on this branch')
    meta = {
        'idle': process(IDLE_SRC, 2, 'idle'),
        'run': process(RUN_SRC, 5, 'run'),
        'canvas': list(CANVAS),
        'footLineY': FOOTLINE,
        'shadowPolicy': 'detached floor/shadow components are discarded before fitting',
    }
    make_preview()
    (OUT_DIR / 'extraction-meta.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(json.dumps(meta, indent=2))
