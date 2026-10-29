import sys
from pathlib import Path
import pytest

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from ai.vision.model_loader import vision_manager

@pytest.fixture(autouse=True, scope="session")
def init_test_model():
    vision_manager.initialize()
