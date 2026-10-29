"""
FAUNA-X: API Endpoints Integration Test Suite
"""
import pytest
from httpx import AsyncClient, ASGITransport
from pathlib import Path

from backend.app.main import app

@pytest.mark.asyncio
async def test_root_and_ai_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test Root
        res = await ac.get("/")
        assert res.status_code == 200
        assert res.json()["problem_statement"] == "SIH26128"

        # Test AI Health
        health_res = await ac.get("/api/ai/health")
        assert health_res.status_code == 200
        data = health_res.json()
        assert data["status"] == "ready"
        assert data["task"] == "classification"
        assert "lumpy_skin" in data["classes"]

@pytest.mark.asyncio
async def test_auth_login_farmer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/auth/login", json={
            "email": "farmer@faunax.gov.in",
            "password": "Farmer@123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "FARMER"

@pytest.mark.asyncio
async def test_direct_vision_predict():
    base_dir = Path(__file__).resolve().parent.parent
    sample_images = list((base_dir / "data" / "external_test").rglob("*.jpg"))
    assert len(sample_images) > 0

    sample_path = sample_images[0]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with open(sample_path, "rb") as f:
            files = {"image": (sample_path.name, f, "image/jpeg")}
            data = {"animal_species": "cattle"}
            res = await ac.post("/api/ai/vision/predict", files=files, data=data)
            assert res.status_code == 200
            json_data = res.json()
            assert "prediction" in json_data
            assert json_data["prediction"]["class"] in ["fmd", "healthy", "lumpy_skin"]
            assert json_data["requires_veterinary_verification"] is True

@pytest.mark.asyncio
async def test_map_cases():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/map/cases")
        assert res.status_code == 200
        cases = res.json()
        assert len(cases) > 0
        assert "latitude" in cases[0]
        assert "longitude" in cases[0]
