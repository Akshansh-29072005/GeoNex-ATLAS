import { useState, useMemo } from "react";
import { MapPin, Hash, Ruler } from "lucide-react";
import { plotsAPI } from "@/lib/api-client";
import { PlotDrawer } from "./plot-drawer";

// Calculate area from GeoJSON coordinates (approximate in sqm)
function calculatePolygonArea(geometry: any): number {
    if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) return 0;
    const coords = geometry.coordinates[0];
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = toRad(coords[i][1]);
        const lat2 = toRad(coords[j][1]);
        const dLng = toRad(coords[j][0] - coords[i][0]);
        area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * 6378137 * 6378137) / 2);
    return Math.round(area);
}

export function PlotRegistrationForm({ onClose }: { onClose: () => void }) {
    const [formData, setFormData] = useState({
        location_name: "",
        district: "",
        source: "MANUAL",
        geojson: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const autoPlotId = useMemo(() => `P-${Date.now().toString(36).toUpperCase()}`, []);

    const estimatedArea = useMemo(() => {
        if (!formData.geojson) return 0;
        try {
            const geom = JSON.parse(formData.geojson);
            return calculatePolygonArea(geom);
        } catch {
            return 0;
        }
    }, [formData.geojson]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGeoJSONChange = (geojson: string) => {
        setFormData({ ...formData, geojson });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await plotsAPI.create({
                district: formData.district,
                location_name: formData.location_name,
                geojson: formData.geojson || "{}",
            });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to register plot");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b bg-primary/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Register New Plot</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column: Form Fields */}
                        <div className="space-y-4">
                            <h4 className="font-medium border-b pb-2">Plot Details</h4>

                            {/* Auto-Generated Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <Hash className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase">Plot ID (Auto)</p>
                                        <p className="text-sm font-bold font-mono text-primary">{autoPlotId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                    <Ruler className="h-4 w-4 text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase">Est. Area</p>
                                        <p className="text-sm font-bold font-mono text-emerald-600">
                                            {estimatedArea > 0 ? `${estimatedArea.toLocaleString()} sqm` : "Draw boundary"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">District *</label>
                                <input
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="Raipur"
                                    className="w-full border rounded-md p-2 text-sm bg-background"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Location Name</label>
                                <input
                                    name="location_name"
                                    value={formData.location_name}
                                    onChange={handleChange}
                                    placeholder="Urla Industrial Area"
                                    className="w-full border rounded-md p-2 text-sm bg-background"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Source</label>
                                <select
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2 text-sm bg-background"
                                >
                                    <option value="MANUAL">Manual Entry</option>
                                    <option value="IMPORTED">Imported</option>
                                    <option value="SURVEY">Field Survey</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Column: Map Drawer */}
                        <div>
                            <h4 className="font-medium border-b pb-2 mb-4">Boundary Mapping</h4>
                            <PlotDrawer onChange={handleGeoJSONChange} />
                            <input
                                type="hidden"
                                name="geojson"
                                value={formData.geojson}
                                required
                            />
                            {(!formData.geojson || formData.geojson === "") && (
                                <p className="text-xs text-destructive mt-1">
                                    * Please draw a polygon on the map (min 3 points)
                                </p>
                            )}
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSubmitting ? "Registering..." : "Register Plot"}
                    </button>
                </div>
            </div>
        </div>
    );
}
