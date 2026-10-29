#!/usr/bin/env python3
"""
FAUNA-X: Reproducible Dataset Downloader
Downloads peer-reviewed, open-licensed livestock datasets from Zenodo with integrity verification.
"""
import os
import sys
import hashlib
import json
import urllib.request
import zipfile
from pathlib import Path
from tqdm import tqdm

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DATASETS = [
    {
        "id": "zenodo_lsd",
        "name": "LumpySkinDisease_DataHub",
        "doi": "10.5281/zenodo.11003967",
        "url": "https://zenodo.org/api/records/11003967/files/LumpySkinDisease_DataHub.zip/content",
        "filename": "LumpySkinDisease_DataHub.zip",
        "target_dir": "data/raw/lumpy_skin",
        "expected_md5": "81d77de795a5aaf5c446b872335f64d5",
        "expected_size": 511548905,
        "license": "CC-BY-4.0",
        "author": "Francesco Branda (Universita Campus Bio-Medico)"
    },
    {
        "id": "zenodo_fmd",
        "name": "FMD Cattle",
        "doi": "10.5281/zenodo.7779246",
        "url": "https://zenodo.org/api/records/7779246/files/FMD_Cattle.zip/content",
        "filename": "FMD_Cattle.zip",
        "target_dir": "data/raw/fmd",
        "expected_md5": "79185643478182c586a9c5f14e01cdd4",
        "expected_size": 191144108,
        "license": "CC-BY-4.0",
        "author": "Abbie Osborn (University of Surrey)"
    }
]

class DownloadProgressBar(tqdm):
    def update_to(self, b=1, bsize=1, tsize=None):
        if tsize is not None:
            self.total = tsize
        self.update(b * bsize - self.n)

def compute_md5(file_path: Path) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def compute_sha256(file_path: Path) -> str:
    hash_sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hash_sha.update(chunk)
    return hash_sha.hexdigest()

def download_and_extract(dataset_info: dict, root_dir: Path):
    name = dataset_info["name"]
    url = dataset_info["url"]
    filename = dataset_info["filename"]
    target_dir = root_dir / dataset_info["target_dir"]
    raw_archive_dir = root_dir / "data" / "raw" / "archives"
    raw_archive_dir.mkdir(parents=True, exist_ok=True)
    target_dir.mkdir(parents=True, exist_ok=True)

    archive_path = raw_archive_dir / filename

    print(f"\n========================================================")
    print(f"Dataset: {name}")
    print(f"DOI:     {dataset_info['doi']}")
    print(f"License: {dataset_info['license']}")
    print(f"URL:     {url}")
    print(f"========================================================")

    # Step 1: Check if already downloaded and verified
    needs_download = True
    if archive_path.exists():
        actual_size = archive_path.stat().st_size
        print(f"Found existing archive ({actual_size} bytes). Verifying checksum...")
        md5 = compute_md5(archive_path)
        if md5 == dataset_info.get("expected_md5"):
            print(f"[OK] MD5 verified: {md5}")
            needs_download = False
        else:
            print(f"! Checksum mismatch (Expected: {dataset_info.get('expected_md5')}, got: {md5}). Redownloading...")

    if needs_download:
        print(f"Downloading {filename}...")
        headers = {"User-Agent": "FAUNA-X-ML-Pipeline/1.0"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            total_size = int(response.info().get('Content-Length', 0))
            with DownloadProgressBar(unit='B', unit_scale=True, miniters=1, desc=filename, total=total_size) as t:
                with open(archive_path, 'wb') as out_file:
                    while True:
                        buffer = response.read(1024 * 1024)
                        if not buffer:
                            break
                        out_file.write(buffer)
                        t.update(len(buffer))

        # Verify downloaded file
        md5 = compute_md5(archive_path)
        sha256 = compute_sha256(archive_path)
        if dataset_info.get("expected_md5") and md5 != dataset_info["expected_md5"]:
            raise ValueError(f"MD5 mismatch for {filename}: expected {dataset_info['expected_md5']}, got {md5}")
        print(f"[OK] Download complete. MD5: {md5}")
        print(f"[OK] SHA256: {sha256}")
    else:
        sha256 = compute_sha256(archive_path)

    # Step 2: Extract
    print(f"Extracting to {target_dir}...")
    with zipfile.ZipFile(archive_path, 'r') as zip_ref:
        zip_ref.extractall(target_dir)
    print(f"[OK] Extraction complete.")

    # Step 3: Record manifest
    manifest = {
        "id": dataset_info["id"],
        "name": dataset_info["name"],
        "doi": dataset_info["doi"],
        "url": dataset_info["url"],
        "archive_file": str(archive_path.relative_to(root_dir)),
        "target_dir": str(target_dir.relative_to(root_dir)),
        "size_bytes": archive_path.stat().st_size,
        "md5": md5,
        "sha256": sha256,
        "license": dataset_info["license"],
        "author": dataset_info["author"]
    }
    manifest_path = root_dir / "datasets" / "manifests" / f"{dataset_info['id']}_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[OK] Saved manifest: {manifest_path}")

def main():
    root_dir = Path(__file__).resolve().parent.parent
    print("FAUNA-X DATASET ACQUISITION PIPELINE")
    print(f"Workspace Root: {root_dir}")
    
    for ds in DATASETS:
        try:
            download_and_extract(ds, root_dir)
        except Exception as e:
            print(f"Error downloading {ds['name']}: {e}", file=sys.stderr)
            raise e
            
    print("\n[OK] All target datasets successfully downloaded and verified.")

if __name__ == "__main__":
    main()
