#!/usr/bin/env python3
"""
FAUNA-X: ML Environment Verification Script
Checks Python, PyTorch, CUDA, GPU VRAM, and Ultralytics setup.
"""
import sys
import platform

def check_environment():
    print("=" * 45)
    print("FAUNA-X ML ENVIRONMENT")
    print("=" * 45)
    
    # Python Version
    python_ver = sys.version.split()[0]
    os_info = f"{platform.system()} {platform.release()}"
    print(f"Python:          {python_ver} ({os_info})")
    
    # PyTorch
    try:
        import torch
        torch_ver = torch.__version__
        cuda_avail = torch.cuda.is_available()
        print(f"PyTorch:         {torch_ver}")
        print(f"CUDA Available:  {cuda_avail}")
        
        if cuda_avail:
            cuda_ver = torch.version.cuda
            gpu_name = torch.cuda.get_device_name(0)
            total_vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 2)
            allocated_mb = torch.cuda.memory_allocated(0) / (1024 ** 2)
            cached_mb = torch.cuda.memory_reserved(0) / (1024 ** 2)
            print(f"CUDA Version:    {cuda_ver}")
            print(f"GPU:             {gpu_name}")
            print(f"GPU Memory:      {total_vram_mb:.0f} MiB total (Allocated: {allocated_mb:.1f} MiB, Reserved: {cached_mb:.1f} MiB)")
        else:
            print("CUDA Version:    N/A")
            print("GPU:             None (CPU mode only - WARNING: CUDA recommended for RTX 2050)")
            print("GPU Memory:      N/A")
    except ImportError:
        print("PyTorch:         NOT INSTALLED")
        print("CUDA Available:  False")
        return False
        
    # Ultralytics
    try:
        import ultralytics
        ultralytics_ver = ultralytics.__version__
        print(f"Ultralytics:     {ultralytics_ver}")
    except ImportError:
        print("Ultralytics:     NOT INSTALLED")
        return False

    print("=" * 45)
    return True

if __name__ == "__main__":
    success = check_environment()
    sys.exit(0 if success else 1)
