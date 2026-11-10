"""Prepare the lab stimulus images for the online study. Run once:

    python3 tools/prepare_stimuli.py /path/to/original/image/folder

What it does
  1. Trims the white canvas from every image (the lab files are 1280x720 with the photo
     or face cut-out centered on white), so faces show at their true size in boxes and
     arrows can be placed exactly. Faces keep their original scale (all crops share one height).
  2. Saves the trimmed images to stimuli/ with lowercase ".png" names
     (web hosts treat IMG_N1.PNG and IMG_N1.png as different files).
  3. Finds where each person's cut-out sits inside its group photo and writes
     stim_layout.js, which the experiment uses to put the arrow over the right person.

Needs: pip install pillow numpy
"""
import sys, os, re, json
import numpy as np
from PIL import Image, ImageChops

src = sys.argv[1]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = os.path.join(root, "stimuli")
os.makedirs(out, exist_ok=True)


def trim(im, thresh=12):
    im = im.convert("RGB")
    diff = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).convert("L")
    bbox = diff.point(lambda v: 255 if v > thresh else 0).getbbox()
    return im.crop(bbox) if bbox else im


trimmed = {}
for f in sorted(os.listdir(src)):
    if not f.lower().endswith((".png", ".jpg", ".jpeg")):
        continue
    name = os.path.splitext(f)[0] + ".png"
    dest = os.path.join(out, name)
    if os.path.exists(dest):  # already done on an earlier run: reuse it
        trimmed[name] = Image.open(dest).convert("RGB")
        continue
    im = trim(Image.open(os.path.join(src, f)))
    im.save(dest)
    trimmed[name] = im
print(f"trimmed {len(trimmed)} images into {out}")

# Locate each Single cut-out inside its group photo (same scale, so a horizontal search is enough).
layout, problems = {}, []
for name, group in trimmed.items():
    m = re.fullmatch(r"IMG_N(\d+)\.png", name)
    if not m:
        continue
    k = m.group(1)
    g = np.asarray(group.convert("L"), dtype=np.float32)
    layout[k] = {}
    for pos in "LMR":
        s_name = f"IMG_{pos}S{k}.png"
        if s_name not in trimmed:
            problems.append(f"missing {s_name}")
            continue
        s = np.asarray(trimmed[s_name].convert("L"), dtype=np.float32)
        h = min(s.shape[0], g.shape[0])
        s, gg = s[:h], g[:h]
        w = s.shape[1]
        if w > gg.shape[1]:
            problems.append(f"{s_name} wider than its group photo")
            continue
        errs = [np.abs(gg[:, x:x + w] - s).mean() for x in range(gg.shape[1] - w + 1)]
        x = int(np.argmin(errs))
        if errs[x] > 8:
            problems.append(f"{s_name}: weak match in IMG_N{k}.png (error {errs[x]:.1f})")
        layout[k][pos] = round((x + w / 2) / gg.shape[1], 4)

with open(os.path.join(root, "stim_layout.js"), "w") as fh:
    fh.write("// Arrow x-position (fraction of photo width) for each person, made by tools/prepare_stimuli.py\n")
    fh.write("const STIM_LAYOUT = " + json.dumps(layout) + ";\n")
print(f"located people in {len(layout)} group photos; wrote stim_layout.js")
if problems:
    print("check these:", *problems, sep="\n  ")
