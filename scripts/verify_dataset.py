#!/usr/bin/env python3
"""
FAUNA-X: Dataset Integrity & Leakage Verification Script
Runs pre-flight verification on processed splits:
- Confirms folder structure and valid image counts
- Verifies image readability and non-zero dimensions
- Tests cross-split MD5 hashes to guarantee 0% train/val/test data leakage
"""
import sys
import hashlib
from pathlib import Path
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def compute_hash(filepath: Path) -> str:
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def verify_dataset(root_dir: Path):
    cls_dir = root_dir / "data" / "processed" / "livestock_cls"
    splits = ["train", "val", "test"]
    
    print("=" * 55)
    print("FAUNA-X DATASET PRE-FLIGHT VERIFICATION")
    print("=" * 55)

    if not cls_dir.exists():
        print(f"Error: Processed dataset directory {cls_dir} does not exist.")
        return False

    split_hashes = {}
    total_verified = 0

    for split in splits:
        split_path = cls_dir / split
        if not split_path.exists():
            print(f"Error: Split directory {split_path} not found.")
            return False

        classes = [d for d in split_path.iterdir() if d.is_dir()]
        print(f"\nVerifying split '{split}' ({len(classes)} classes):")
        
        split_hashes[split] = set()
        for c in classes:
            images = list(c.glob("*.jpg")) + list(c.glob("*.png"))
            print(f"  - Class '{c.name}': {len(images)} images")
            
            if len(images) == 0:
                print(f"  ! Warning: Class '{c.name}' has 0 images in {split}!")
                return False

            for img_p in images:
                try:
                    with Image.open(img_p) as img:
                        w, h = img.size
                        if w <= 0 or h <= 0:
                            print(f"  ! Error: Invalid dimensions for {img_p}")
                            return False
                    
                    h_val = compute_hash(img_p)
                    split_hashes[split].add((h_val, str(img_p)))
                    total_verified += 1
                except Exception as e:
                    print(f"  ! Error opening image {img_p}: {e}")
                    return False

    # Check for Data Leakage across splits
    print("\n-------------------------------------------------------")
    print("Cross-Split Data Leakage Test (MD5 Collision Check):")
    
    train_h = {h for h, _ in split_hashes["train"]}
    val_h = {h for h, _ in split_hashes["val"]}
    test_h = {h for h, _ in split_hashes["test"]}

    leak_train_val = train_h.intersection(val_h)
    leak_train_test = train_h.intersection(test_h)
    leak_val_test = val_h.intersection(test_h)

    leak_found = False
    if leak_train_val:
        print(f"! CRITICAL LEAKAGE: {len(leak_train_val)} images overlap between Train and Val!")
        leak_found = True
    if leak_train_test:
        print(f"! CRITICAL LEAKAGE: {len(leak_train_test)} images overlap between Train and Test!")
        leak_found = True
    if leak_val_test:
        print(f"! CRITICAL LEAKAGE: {len(leak_val_test)} images overlap between Val and Test!")
        leak_found = True

    if not leak_found:
        print("[OK] PASSED: 0% data leakage detected between Train, Val, and Test splits.")
    else:
        return False

    print("-------------------------------------------------------")
    print(f"[OK] Verification Successful! {total_verified} images verified across all splits.")
    print("=" * 55)
    return True

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    success = verify_dataset(root_dir)
    sys.exit(0 if success else 1)
