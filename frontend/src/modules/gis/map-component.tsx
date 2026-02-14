import { MapContainer, TileLayer, WMSTileLayer, LayersControl, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import { PlotDetails } from "./plot-details";
import { plotsAPI } from "@/lib/api-client";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { useAuthStore } from "@/lib/store";
import { RegisterPlotModal } from "./register-plot-modal";

// Fix for default marker icons in React Leaflet
// @ts-expect-error - Leaflet icon structure
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapController() {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
}

function DrawControl({ onCreated }: { onCreated: (geojson: any) => void }) {
    const map = useMap();

    useEffect(() => {
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    showArea: false, // Fix for "type is not defined" error
                    allowIntersection: false,
                },
                polyline: false,
                rectangle: {
                    showArea: false, // Fix for "type is not defined" error
                },
                circle: false,
                marker: false,
                circlemarker: false,
            },
            edit: {
                featureGroup: new L.FeatureGroup(),
                edit: false,
                remove: false
            },
        });

        map.addControl(drawControl);

        const handleCreated = (e: any) => {
            const layer = e.layer;
            const geojson = layer.toGeoJSON();
            onCreated(geojson);
            map.removeLayer(layer);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, handleCreated);
        };
    }, [map, onCreated]);

    return null;
}

export function MapComponent({ filterStatus, minimal, initialLat, initialLng, initialZoom }: { filterStatus?: string, minimal?: boolean, initialLat?: number, initialLng?: number, initialZoom?: number }) {
    const [plots, setPlots] = useState<any[]>([]);
    const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [newPlotGeoJSON, setNewPlotGeoJSON] = useState<any>(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const loadPlots = async () => {
        try {
            const { data } = await plotsAPI.getAll();
            let loadedPlots = Array.isArray(data) ? data : [];

            // Filter by Status if provided (e.g. AVAILABLE / COMPLIANT only)
            if (filterStatus) {
                // Assuming 'COMPLIANT' and system ownership implies available? 
                // Or if we have explicit 'AVAILABLE' status. 
                // The user said "green plots... good for them". Green defaults to System Owned.
                // So if filterStatus is "AVAILABLE", checking for System ownership.
                if (filterStatus === 'AVAILABLE') {
                    loadedPlots = loadedPlots.filter(p => p.owner_id === "00000000-0000-0000-0000-000000000000");
                } else {
                    loadedPlots = loadedPlots.filter(p => p.status === filterStatus);
                }
            }

            setPlots(loadedPlots);
        } catch (error) {
            console.error("Failed to load plots:", error);
            setPlots([]);
        }
    };

    useEffect(() => {
        loadPlots();
    }, [filterStatus]);

    const handlePlotCreated = (geojson: any) => {
        setNewPlotGeoJSON(geojson);
        setIsRegisterModalOpen(true);
    };

    const handleRegistrationSuccess = () => {
        loadPlots();
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (!term) {
            setSearchResults([]);
            return;
        }
        const lowerTerm = term.toLowerCase();
        const results = plots.filter(p =>
            p.id.toLowerCase().includes(lowerTerm) ||
            p.district?.toLowerCase().includes(lowerTerm) ||
            p.location_name?.toLowerCase().includes(lowerTerm)
        );
        setSearchResults(results);
    };

    const handleSelectSearchResult = (plot: any) => {
        setSelectedPlotId(plot.id);
        setSearchResults([]);
        setSearchTerm(""); // Optional: clear search on select
    };

    // Zoom Component to access map instance
    function SearchZoomController({ targetPlotId }: { targetPlotId: string | null }) {
        const map = useMap();
        useEffect(() => {
            if (targetPlotId && plots.length > 0) {
                const plot = plots.find(p => p.id === targetPlotId);
                if (plot && plot.geojson) {
                    try {
                        const geoData = JSON.parse(plot.geojson);
                        const layer = L.geoJSON(geoData);
                        map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
                    } catch (e) {
                        console.error("Zoom error", e);
                    }
                }
            }
        }, [targetPlotId, plots, map]);
        return null;
    }

    const getPlotStyle = (plot: any) => {
        // Default: Green (Govt/System Owned, Available)
        // System Owner ID is 00000000-0000-0000-0000-000000000000
        const isSystemOwned = plot.owner_id === "00000000-0000-0000-0000-000000000000";

        let color = '#22c55e'; // Green
        let fillColor = '#22c55e';

        // 1. VIOLATION -> Red
        if (plot.status === 'VIOLATION') {
            color = '#ef4444';
            fillColor = '#ef4444';
        }
        // 2. SUSPECTED -> Yellow
        else if (plot.status === 'SUSPECTED') {
            color = '#eab308';
            fillColor = '#eab308';
        }
        // 3. LEASED / INDUSTRY OWNED -> Blue
        else if (!isSystemOwned) {
            color = '#3b82f6';
            fillColor = '#3b82f6';
        }
        // 4. GOVT / AVAILABLE -> Green (Default)

        return {
            color,
            fillColor,
            fillOpacity: 0.5,
            weight: 2,
            dashArray: plot.status === 'SUSPECTED' ? '5, 5' : undefined // Dashed line for suspected
        };
    };

    return (
        <div className="h-full w-full rounded-lg border overflow-hidden relative flex">
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={[initialLat || 21.2514, initialLng || 81.6296]} // Centered on Urla
                    zoom={initialZoom || 14}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                >
                    <MapController />
                    <SearchZoomController targetPlotId={selectedPlotId} />

                    {isAdmin && !minimal && (
                        <DrawControl onCreated={handlePlotCreated} />
                    )}

                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Reference Map (OSM)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name="Satellite (Esri World Imagery)">
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name="Sentinel-2 (WMS)">
                            <WMSTileLayer
                                attribution='Sentinel-2 Cloudless - https://s2maps.eu'
                                url="https://tiles.maps.eox.at/wms"
                                layers="s2cloudless-2020_3857"
                                format="image/jpeg"
                                transparent={false}
                                version="1.1.1"
                                detectRetina={true}
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name="PlanetHub Imagery (10-Day Updates)">
                            <TileLayer
                                attribution='PlanetHub &copy; 2024 - High Res Monitoring'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" // Placeholder; In real app, use Planet XYZ URL
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    {/* Render Real Plots from API */}
                    {Array.isArray(plots) && plots.map((plot) => {
                        if (!plot.geojson) return null;
                        try {
                            const geoData = JSON.parse(plot.geojson);
                            return (
                                <GeoJSON
                                    key={plot.id}
                                    data={geoData}
                                    style={() => getPlotStyle(plot)}
                                    onEachFeature={(feature, _layer) => {
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        feature.properties = { ...feature.properties, plotId: plot.id };
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedPlotId(plot.id)
                                    }}
                                >
                                    <Popup>
                                        <div className="p-1">
                                            <h3 className="font-bold">Plot {plot.id}</h3>
                                            <p className="text-sm">Location: {plot.location_name || 'N/A'}</p>
                                            <p className="text-sm">Area: {Math.round(plot.area_sqm)} sqm</p>
                                            <button
                                                onClick={() => setSelectedPlotId(plot.id)}
                                                className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded w-full"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </Popup>
                                </GeoJSON>
                            );
                        } catch (e) {
                            console.error("Invalid GeoJSON for plot", plot.id, e);
                            return null;
                        }
                    })}

                    {/* Default Marker */}
                    <Marker position={[21.2514, 81.6296]}>
                        <Popup>Urla Industrial Area Center</Popup>
                    </Marker>

                </MapContainer>

                {/* Legend for Admin */}
                {isAdmin && !minimal && (
                    <div className="absolute top-4 right-16 z-[400] bg-white/90 p-2 rounded shadow text-xs">
                        <p className="font-bold">Admin Mode</p>
                        <p>Use toolbar to Add Plots</p>
                    </div>
                )}

                {/* Search Overlay */}
                {!minimal && (
                    <div className="absolute top-4 left-4 z-[400] w-72">
                        <div className="bg-background/90 backdrop-blur p-2 rounded-md shadow-md border flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search Plot ID or District..."
                                className="w-full bg-transparent border-none text-sm focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        {searchResults.length > 0 && (
                            <ul className="mt-1 bg-background/95 backdrop-blur rounded-md shadow-lg border max-h-60 overflow-y-auto">
                                {searchResults.map(plot => (
                                    <li
                                        key={plot.id}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer border-b last:border-0"
                                        onClick={() => handleSelectSearchResult(plot)}
                                    >
                                        <div className="font-medium">{plot.id}</div>
                                        <div className="text-xs text-muted-foreground">{plot.location_name || "Unknown"}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Side Panel */}
            {selectedPlotId && !minimal && (
                <PlotDetails
                    plotId={selectedPlotId}
                    onClose={() => setSelectedPlotId(null)}
                />
            )}

            {/* Register Plot Modal */}
            {isRegisterModalOpen && newPlotGeoJSON && (
                <RegisterPlotModal
                    isOpen={isRegisterModalOpen}
                    geoJSON={newPlotGeoJSON}
                    onClose={() => setIsRegisterModalOpen(false)}
                    onSuccess={handleRegistrationSuccess}
                />
            )}
        </div>
    );
}
