"""Pixel checks for the centre-split intro, for a model that cannot look at
images: proves the mark straddles the seam while covered, that the seam glows,
and that the site (not the cover) is what is left on screen afterwards.

Run:  python tests/3d-intro-pixels.py
"""
import json
import pathlib
import sys

from PIL import Image, ImageStat

ROOT = pathlib.Path(__file__).resolve().parent.parent
FRAMES = json.loads((ROOT / "test-results/3d-intro-frames.json").read_text(encoding="utf-8"))
SEAM = 720  # viewport centre of the 1440px capture


def band_stats(image, box):
    crop = image.crop(box).convert("L")
    stat = ImageStat.Stat(crop)
    return {"mean": round(stat.mean[0], 1), "max": crop.getextrema()[1]}


def ink_pixels(image, box, threshold=120):
    crop = image.crop(box).convert("L")
    return sum(1 for value in crop.getdata() if value > threshold)


def check(frame, label):
    image = Image.open(ROOT / "test-results" / frame)
    mark = FRAMES["mark"]
    top, height = mark["top"], mark["height"]
    row = (top, top + height)
    results = {
        "size": image.size,
        "overall": band_stats(image, (0, 0, image.width, image.height)),
        "mark_left_ink": ink_pixels(image, (SEAM - 160, row[0], SEAM - 2, row[1])),
        "mark_right_ink": ink_pixels(image, (SEAM + 2, row[0], SEAM + 160, row[1])),
        "mark_far_left_ink": ink_pixels(image, (60, row[0], SEAM - 300, row[1])),
        "seam_column": band_stats(image, (SEAM - 1, 120, SEAM + 1, 780)),
        "beside_seam": band_stats(image, (SEAM - 40, 120, SEAM - 20, 780)),
    }
    print(label, json.dumps(results, indent=1))
    return results


cover = check("3d-intro-cover.png", "COVER (before the split)")
opening = check("3d-intro-opening.png", "OPENING (mid split)")
revealed = check("3d-intro-revealed.png", "REVEALED (site uncovered)")

failures = []
if cover["overall"]["mean"] > 60:
    failures.append("cover frame is not a dark splash")
if cover["mark_left_ink"] < 50 or cover["mark_right_ink"] < 50:
    failures.append("the mark does not straddle the centre seam")
if cover["mark_far_left_ink"] > 0:
    failures.append("stray copy of the mark away from the centre")
if cover["seam_column"]["mean"] <= cover["beside_seam"]["mean"]:
    failures.append("seam glow is not brighter than its neighbours")
if FRAMES["loaders"]:
    failures.append("the cover still renders a loading indicator")
if opening["mark_left_ink"] >= cover["mark_left_ink"]:
    failures.append("the left half did not carry its copy away")
if revealed["overall"]["mean"] <= cover["overall"]["mean"]:
    failures.append("the revealed frame is not the brighter site underneath")

print("\nFAILURES:", failures or "none")
sys.exit(1 if failures else 0)
