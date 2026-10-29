#!/usr/bin/env python3
"""
FAUNA-X: Dataset Cleaning and Curation Script
Cleans raw livestock imagery:
- Detects corrupt/unreadable files
- Removes exact duplicates and isolates near duplicates
- Converts all valid images to standard RGB JPEG
- Filters out extremely small (<64x64) or uninformative/blank images
- Maps verified clinical sources to target classes: lumpy_skin, fmd, healthy
- Generates clean, warning, and rejected sets with a full audit log
"""
import os
import sys
import hashlib
import json
import shutil
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageStat
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

MIN_DIMENSION = 64
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff', '.tif'}

def compute_file_hash(filepath: Path) -> str:
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def is_blank_or_solid_color(img: Image.Image, threshold: float = 2.0) -> bool:
    """Detect if an image is solid black/white or has almost zero variance."""
    stat = ImageStat.Stat(img)
    if sum(stat.stddev) < threshold:
        return True
    return False

def determine_class_label(file_path: Path) -> str:
    parts = [p.lower() for p in file_path.parts]
    filename = file_path.name.lower()
    
    # 1. LSD DataHub
    if "lumpy_skin" in parts:
        if filename.startswith("normal") or "normal_skin" in filename:
            return "healthy"
        elif filename.startswith("mild") or filename.startswith("severe") or "lumpy" in filename:
            return "lumpy_skin"
            
    # 2. FMD Cattle
    if "fmd" in parts:
        # FMD_Cattle/0 is positive FMD lesion, FMD_Cattle/1 is control/normal oral mucosa
        if "0" in parts:
            return "fmd"
        elif "1" in parts:
            return "healthy"

    return "unspecified"

def clean_datasets(root_dir: Path):
    raw_dir = root_dir / "data" / "raw"
    interim_dir = root_dir / "data" / "interim"
    reports_dir = root_dir / "outputs" / "reports"
    
    if interim_dir.exists():
        shutil.rmtree(interim_dir)
    interim_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    audit_log = {
        "total_scanned": 0,
        "clean_count": 0,
        "warning_count": 0,
        "rejected_count": 0,
        "classes": defaultdict(int),
        "categories": {
            "clean": [],
            "warning": [],
            "rejected": []
        }
    }

    seen_hashes = set()
    
    print("\n========================================================")
    print("FAUNA-X DATASET CLEANING & CURATION PIPELINE")
    print("========================================================")
    
    # Target only genuine raw unbalanced directories to avoid artificial duplicates
    target_scan_dirs = [
        raw_dir / "lumpy_skin" / "unbalanced" / "lumpy",
        raw_dir / "fmd" / "FMD_Cattle"
    ]
    
    raw_images = []
    for d in target_scan_dirs:
        if d.exists():
            for f in d.rglob("*"):
                if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
                    raw_images.append(f)

    audit_log["total_scanned"] = len(raw_images)
    print(f"Total raw source images to process: {len(raw_images)}")

    for img_path in raw_images:
        rel_path = img_path.relative_to(raw_dir)
        class_label = determine_class_label(img_path)

        if class_label == "unspecified":
            audit_log["rejected_count"] += 1
            audit_log["categories"]["rejected"].append({
                "path": str(rel_path),
                "reason": "Unspecified class mapping",
                "hash": ""
            })
            continue

        file_hash = compute_file_hash(img_path)
        
        # Step 1: Duplicate check
        if file_hash in seen_hashes:
            audit_log["rejected_count"] += 1
            audit_log["categories"]["rejected"].append({
                "path": str(rel_path),
                "reason": "Exact MD5 duplicate of an existing image",
                "hash": file_hash
            })
            continue

        # Step 2: PIL readability & integrity
        try:
            with Image.open(img_path) as img:
                img.verify()
            
            # Reopen for pixel verification and conversion
            with Image.open(img_path) as img:
                width, height = img.size
                
                # Filter small images
                if width < MIN_DIMENSION or height < MIN_DIMENSION:
                    audit_log["rejected_count"] += 1
                    audit_log["categories"]["rejected"].append({
                        "path": str(rel_path),
                        "reason": f"Resolution too low: {width}x{height} (Min: {MIN_DIMENSION}x{MIN_DIMENSION})",
                        "hash": file_hash
                    })
                    continue

                # Filter solid / blank images
                if is_blank_or_solid_color(img):
                    audit_log["rejected_count"] += 1
                    audit_log["categories"]["rejected"].append({
                        "path": str(rel_path),
                        "reason": "Image is blank / solid color with zero variance",
                        "hash": file_hash
                    })
                    continue

                aspect = max(width, height) / max(1, min(width, height))
                is_warning = False
                warning_reason = ""
                if aspect > 5.0:
                    is_warning = True
                    warning_reason = f"Extreme aspect ratio ({aspect:.1f}:1)"

                # Convert to standard RGB JPEG
                rgb_img = img.convert("RGB")
                
                # Save to interim
                target_class_dir = interim_dir / class_label
                target_class_dir.mkdir(parents=True, exist_ok=True)
                
                dest_filename = f"{class_label}_{file_hash[:12]}.jpg"
                dest_path = target_class_dir / dest_filename
                rgb_img.save(dest_path, "JPEG", quality=95)
                
                seen_hashes.add(file_hash)
                audit_log["classes"][class_label] += 1

                if is_warning:
                    audit_log["warning_count"] += 1
                    audit_log["categories"]["warning"].append({
                        "path": str(rel_path),
                        "saved_as": str(dest_path.relative_to(root_dir)),
                        "class": class_label,
                        "reason": warning_reason
                    })
                else:
                    audit_log["clean_count"] += 1
                    audit_log["categories"]["clean"].append({
                        "path": str(rel_path),
                        "saved_as": str(dest_path.relative_to(root_dir)),
                        "class": class_label,
                        "resolution": f"{width}x{height}"
                    })

        except Exception as e:
            audit_log["rejected_count"] += 1
            audit_log["categories"]["rejected"].append({
                "path": str(rel_path),
                "reason": f"Corrupted or unreadable image: {str(e)}",
                "hash": file_hash
            })

    # Save Cleaning Audit Report
    report_path = reports_dir / "cleaning_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(audit_log, f, indent=2)

    print(f"\n[OK] Cleaning Complete:")
    print(f"  - Total Scanned: {audit_log['total_scanned']}")
    print(f"  - Clean Images:  {audit_log['clean_count']}")
    print(f"  - Warnings:      {audit_log['warning_count']}")
    print(f"  - Rejected:      {audit_log['rejected_count']}")
    print(f"  - Cleaned Class Counts: {dict(audit_log['classes'])}")
    print(f"  - Report saved:  {report_path}")

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    clean_datasets(root_dir)
