#!/usr/bin/env python3
"""
FAUNA-X: Dataset Preparation & Stratified Splitting Script
Splits cleaned dataset into Train (70%), Validation (15%), and Test (15%) splits
with class stratification and strict leakage prevention.
Also reserves external holdout evaluation samples in data/external_test/.
"""
import os
import sys
import shutil
import random
from pathlib import Path
from collections import defaultdict
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

RANDOM_SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
EXTERNAL_TEST_COUNT_PER_CLASS = 15

def prepare_splits(root_dir: Path):
    random.seed(RANDOM_SEED)
    interim_dir = root_dir / "data" / "interim"
    processed_cls_dir = root_dir / "data" / "processed" / "livestock_cls"
    external_test_dir = root_dir / "data" / "external_test"

    for split in ["train", "val", "test"]:
        split_dir = processed_cls_dir / split
        if split_dir.exists():
            shutil.rmtree(split_dir)
        split_dir.mkdir(parents=True, exist_ok=True)

    if external_test_dir.exists():
        shutil.rmtree(external_test_dir)
    external_test_dir.mkdir(parents=True, exist_ok=True)

    class_dirs = [d for d in interim_dir.iterdir() if d.is_dir()]
    if not class_dirs:
        print(f"No cleaned classes found in {interim_dir}. Run scripts/clean_dataset.py first.")
        sys.exit(1)

    split_manifest = {
        "seed": RANDOM_SEED,
        "ratios": {"train": TRAIN_RATIO, "val": VAL_RATIO, "test": TEST_RATIO},
        "classes": [d.name for d in class_dirs],
        "counts": {"train": {}, "val": {}, "test": {}, "external_test": {}}
    }

    print("\n========================================================")
    print("FAUNA-X DATASET STRATIFICATION & PREPARATION")
    print(f"Ratios: Train={TRAIN_RATIO*100:.0f}%, Val={VAL_RATIO*100:.0f}%, Test={TEST_RATIO*100:.0f}%")
    print("========================================================")

    for c_dir in class_dirs:
        class_name = c_dir.name
        images = sorted(list(c_dir.glob("*.jpg")) + list(c_dir.glob("*.png")))
        random.shuffle(images)

        total_cls_images = len(images)
        print(f"\nClass '{class_name}': Total {total_cls_images} images")

        ext_count = min(EXTERNAL_TEST_COUNT_PER_CLASS, max(0, total_cls_images - 30))
        ext_images = images[:ext_count]
        remaining_images = images[ext_count:]

        ext_cls_dir = external_test_dir / class_name
        ext_cls_dir.mkdir(parents=True, exist_ok=True)
        for img in ext_images:
            shutil.copy2(img, ext_cls_dir / img.name)
        split_manifest["counts"]["external_test"][class_name] = len(ext_images)

        n_remaining = len(remaining_images)
        n_train = int(n_remaining * TRAIN_RATIO)
        n_val = int(n_remaining * VAL_RATIO)
        n_test = n_remaining - n_train - n_val

        train_imgs = remaining_images[:n_train]
        val_imgs = remaining_images[n_train:n_train + n_val]
        test_imgs = remaining_images[n_train + n_val:]

        split_manifest["counts"]["train"][class_name] = len(train_imgs)
        split_manifest["counts"]["val"][class_name] = len(val_imgs)
        split_manifest["counts"]["test"][class_name] = len(test_imgs)

        for split_name, img_list in [("train", train_imgs), ("val", val_imgs), ("test", test_imgs)]:
            target_dir = processed_cls_dir / split_name / class_name
            target_dir.mkdir(parents=True, exist_ok=True)
            for img in img_list:
                shutil.copy2(img, target_dir / img.name)

        print(f"  - Train:         {len(train_imgs)}")
        print(f"  - Validation:    {len(val_imgs)}")
        print(f"  - Test:          {len(test_imgs)}")
        print(f"  - External Hold: {len(ext_images)}")

    manifest_path = root_dir / "datasets" / "manifests" / "split_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(split_manifest, f, indent=2)

    print(f"\n[OK] Dataset preparation complete. Split manifest saved to {manifest_path}")

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    prepare_splits(root_dir)
