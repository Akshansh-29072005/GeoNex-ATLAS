# GIS Service Package

This package (`pkg/gis`) handles:
- Sentinel Hub API Integration
- Satellite Image Fetching
- NDVI Calculation
- Image Comparison Logic

## Structure
- `sentinel.go`: API Client for Sentinel Hub
- `ndvi.go`: Image processing logic
- `change_detection.go`: Pixel/Object-based comparison
