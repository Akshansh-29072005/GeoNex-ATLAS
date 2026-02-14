# Plots Service Package

This package (`pkg/plots`) handles:
- Plot CRUD Operations
- Shapefile/GeoJSON Ingestion
- Spatial Queries (PostGIS)

## Structure
- `handler.go`: HTTP Handlers
- `repository.go`: PostGIS queries (`ST_Intersects`, `ST_Contains`)
- `model.go`: Structs for Plot, Zone, Owner
