import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, RotateCcw } from "lucide-react";

interface PlotDrawerProps {
    onChange: (geojson: string) => void;
}

function DrawingController({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

export function PlotDrawer({ onChange }: PlotDrawerProps) {
    const [points, setPoints] = useState<L.LatLng[]>([]);

    useEffect(() => {
        if (points.length < 3) {
            onChange("");
            return;
        }

        // Convert to GeoJSON Polygon
        // Coordinates must be [lng, lat] and closed ring (first == last)
        const coords = points.map(p => [p.lng, p.lat]);
        coords.push([points[0].lng, points[0].lat]); // Close the ring

        const geojson = {
            type: "Polygon",
            coordinates: [coords],
        };

        onChange(JSON.stringify(geojson));
    }, [points, onChange]);

    const handleAddPoint = (latlng: L.LatLng) => {
        setPoints(prev => [...prev, latlng]);
    };

    const handleUndo = () => {
        setPoints(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPoints([]);
    };

    return (
        <div className="relative h-[400px] w-full rounded-md border overflow-hidden">
            <MapContainer
                center={[21.2514, 81.6296]} // Default to Urla
                zoom={14}
                className="h-full w-full"
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Esri"
                />

                <DrawingController onMapClick={handleAddPoint} />

                {points.length > 0 && (
                    <>
                        <Polygon
                            positions={points}
                            pathOptions={{ color: points.length >= 3 ? "green" : "orange" }}
                        />
                        {points.map((p, i) => (
                            <Marker
                                key={i}
                                position={p}
                                icon={L.divIcon({
                                    className: "w-2 h-2 bg-white rounded-full border border-black",
                                    iconSize: [8, 8],
                                })}
                            />
                        ))}
                    </>
                )}
            </MapContainer>

            {/* Controls Overlay */}
            <div className="absolute top-2 right-2 z-[400] flex flex-col gap-2 bg-background/90 p-2 rounded shadow backdrop-blur">
                <div className="text-xs font-semibold mb-1">Drawing Tools</div>
                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={points.length === 0}
                    className="flex items-center gap-2 text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded disabled:opacity-50"
                >
                    <RotateCcw size={12} /> Undo Last
                </button>
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={points.length === 0}
                    className="flex items-center gap-2 text-xs px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded disabled:opacity-50"
                >
                    <Trash2 size={12} /> Clear All
                </button>
                <div className="text-[10px] text-muted-foreground mt-1 text-center">
                    {points.length} points
                    {points.length < 3 && " (Need 3+)"}
                </div>
            </div>

            <div className="absolute bottom-2 left-2 z-[400] bg-background/80 px-2 py-1 rounded text-xs">
                Click on map to add points
            </div>
        </div>
    );
}
