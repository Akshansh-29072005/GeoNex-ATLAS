"""
Tests for CSIDC Image Analysis Service (FastAPI + OpenCV)
Run: pytest test_analysis.py -v
"""
import numpy as np
import pytest
from fastapi.testclient import TestClient
from main import (
    app,
    calculate_ndvi,
    classify_vegetation,
    compute_ssim,
    NDVIRequest,
    CompareRequest,
)


client = TestClient(app)


# ============================================
# UNIT TESTS — Pure Functions
# ============================================


class TestNDVICalculation:
    """Test NDVI computation: NDVI = (NIR - Red) / (NIR + Red)"""

    def test_ndvi_healthy_vegetation(self):
        """High NIR, low Red → high NDVI (healthy vegetation)"""
        red = np.full((10, 10), 30, dtype=float)
        nir = np.full((10, 10), 200, dtype=float)
        ndvi = calculate_ndvi(red, nir)
        mean = float(np.mean(ndvi))
        assert mean > 0.5, f"Healthy vegetation should have NDVI > 0.5, got {mean}"

    def test_ndvi_barren_land(self):
        """Similar Red and NIR → NDVI near 0 (barren)"""
        red = np.full((10, 10), 120, dtype=float)
        nir = np.full((10, 10), 130, dtype=float)
        ndvi = calculate_ndvi(red, nir)
        mean = float(np.mean(ndvi))
        assert mean < 0.2, f"Barren land should have NDVI < 0.2, got {mean}"

    def test_ndvi_range(self):
        """NDVI should always be between -1 and 1"""
        red = np.random.randint(0, 255, (50, 50)).astype(float)
        nir = np.random.randint(0, 255, (50, 50)).astype(float)
        ndvi = calculate_ndvi(red, nir)
        assert np.all(ndvi >= -1.0) and np.all(ndvi <= 1.0), "NDVI should be in [-1, 1]"

    def test_ndvi_zero_division(self):
        """When both bands are 0, should not crash"""
        red = np.zeros((10, 10), dtype=float)
        nir = np.zeros((10, 10), dtype=float)
        ndvi = calculate_ndvi(red, nir)
        assert ndvi.shape == (10, 10), "Should return valid array even with zeros"


class TestVegetationClassification:
    """Test NDVI → status classification"""

    def test_non_compliant(self):
        assert classify_vegetation(0.1) == "NON_COMPLIANT"
        assert classify_vegetation(0.0) == "NON_COMPLIANT"
        assert classify_vegetation(-0.5) == "NON_COMPLIANT"

    def test_warning(self):
        assert classify_vegetation(0.2) == "WARNING"
        assert classify_vegetation(0.35) == "WARNING"
        assert classify_vegetation(0.49) == "WARNING"

    def test_compliant(self):
        assert classify_vegetation(0.5) == "COMPLIANT"
        assert classify_vegetation(0.8) == "COMPLIANT"
        assert classify_vegetation(1.0) == "COMPLIANT"


class TestSSIMComputation:
    """Test Structural Similarity Index (SSIM) for change detection"""

    def test_identical_images(self):
        """Identical images should have SSIM close to 1.0"""
        img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        ssim = compute_ssim(img, img)
        assert ssim > 0.95, f"Identical images should have SSIM > 0.95, got {ssim}"

    def test_different_images(self):
        """Very different images should have low SSIM"""
        img1 = np.zeros((100, 100, 3), dtype=np.uint8)
        img2 = np.full((100, 100, 3), 255, dtype=np.uint8)
        ssim = compute_ssim(img1, img2)
        assert ssim < 0.5, f"Very different images should have SSIM < 0.5, got {ssim}"

    def test_ssim_range(self):
        """SSIM should be between -1 and 1"""
        img1 = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
        img2 = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
        ssim = compute_ssim(img1, img2)
        assert -1.0 <= ssim <= 1.0, f"SSIM {ssim} out of range"

    def test_ssim_different_sizes(self):
        """SSIM should handle images of different sizes (resize internally)"""
        img1 = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        img2 = np.random.randint(0, 255, (80, 120, 3), dtype=np.uint8)
        ssim = compute_ssim(img1, img2)
        assert isinstance(ssim, float), "Should return float even with different sizes"


# ============================================
# API ENDPOINT TESTS
# ============================================


class TestHealthEndpoint:
    def test_health(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Analysis Service Running"
        assert data["version"] == "1.0.0"


class TestNDVIEndpoint:
    def test_ndvi_analysis(self):
        """Test NDVI endpoint with dummy URLs (fallback to random images)"""
        response = client.post("/analyze/ndvi", json={
            "red_band_url": "https://example.com/red.tif",
            "nir_band_url": "https://example.com/nir.tif",
            "plot_id": "P-101",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["plot_id"] == "P-101"
        assert "mean_ndvi" in data
        assert "min_ndvi" in data
        assert "max_ndvi" in data
        assert data["vegetation_status"] in ["COMPLIANT", "WARNING", "NON_COMPLIANT"]
        assert 0 <= data["coverage_percent"] <= 100

    def test_ndvi_response_fields(self):
        response = client.post("/analyze/ndvi", json={
            "red_band_url": "http://dummy/red",
            "nir_band_url": "http://dummy/nir",
            "plot_id": "P-500",
        })
        data = response.json()
        assert isinstance(data["mean_ndvi"], float)
        assert isinstance(data["coverage_percent"], float)


from unittest.mock import patch
import numpy as np

class TestCompareEndpoint:
    @patch("main.download_image")
    def test_compare_images(self, mock_download):
        """Test image comparison endpoint with mocked images"""
        # Mock connection to return a black image (no change) or specific pattern
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_download.return_value = img

        response = client.post("/analyze/compare", json={
            "reference_url": "https://example.com/ref.png",
            "latest_url": "https://example.com/latest.png",
            "plot_id": "P-201",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["plot_id"] == "P-201"
        assert "similarity_score" in data
        assert "change_detected" in data

    @patch("main.download_image")
    def test_compare_response_types(self, mock_download):
        # Mock image
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_download.return_value = img
        
        response = client.post("/analyze/compare", json={
            "reference_url": "http://dummy/ref",
            "latest_url": "http://dummy/latest",
            "plot_id": "P-300",
        })
        data = response.json()
        assert isinstance(data["similarity_score"], float)
        assert isinstance(data["change_detected"], bool)


class TestSentinelFetchEndpoint:
    def test_fetch_sentinel(self):
        # Without credentials, it returns SIMULATED response
        response = client.post(
            "/analyze/sentinel/fetch",
            params={"plot_id": "P-101", "bbox": "81.62,21.25,81.63,21.26"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plot_id"] == "P-101"
        
        # Check for Simulation or Real
        if data.get("status") == "SIMULATED":
            assert "image_url" in data
            assert data["message"] == "Sentinel Hub credentials missing. Using simulation."
        else:
            assert data["source"] == "Sentinel-2 L2A"

    def test_fetch_sentinel_fields(self):
        response = client.post(
            "/analyze/sentinel/fetch",
            params={"plot_id": "P-999", "bbox": "0,0,1,1"}
        )
        data = response.json()
        if data.get("status") == "SIMULATED":
             assert "image_url" in data
        else:
            assert "next_pass" in data


# ============================================
# VALIDATION TESTS
# ============================================


class TestValidation:
    def test_ndvi_missing_fields(self):
        response = client.post("/analyze/ndvi", json={})
        assert response.status_code == 422  # Validation error

    def test_compare_missing_fields(self):
        response = client.post("/analyze/compare", json={})
        assert response.status_code == 422
