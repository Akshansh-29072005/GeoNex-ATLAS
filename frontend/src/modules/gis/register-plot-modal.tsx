import { useState, useMemo } from "react";
import { plotsAPI } from "@/lib/api-client";
import { CheckCircle, X, MapPin, Hash, Ruler } from "lucide-react";

interface RegisterPlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    geoJSON: any; // Feature<Polygon>
    onSuccess: () => void;
}

// Calculate area from GeoJSON coordinates (approximate in sqm)
function calculatePolygonArea(geometry: any): number {
    if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) return 0;
    const coords = geometry.coordinates[0];
    // Shoelace formula adapted for geographic coordinates
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

export function RegisterPlotModal({ isOpen, onClose, geoJSON, onSuccess }: RegisterPlotModalProps) {
    const [formData, setFormData] = useState({
        location_name: "",
        district: "",
        source: "MANUAL",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Auto-generated values
    const autoPlotId = useMemo(() => `P-${Date.now().toString(36).toUpperCase()}`, []);
    const estimatedArea = useMemo(() => {
        if (!geoJSON?.geometry) return 0;
        return calculatePolygonArea(geoJSON.geometry);
    }, [geoJSON]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.district) {
            setError("District is required.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            await plotsAPI.create({
                district: formData.district,
                location_name: formData.location_name,
                geojson: JSON.stringify(geoJSON.geometry),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to register plot", err);
            setError(err.response?.data?.error || "Failed to register plot. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-primary/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Register New Plot
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1 rounded-full hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Auto-Generated Info */}
                <div className="px-6 pt-5 pb-2 space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Auto-Generated</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <Hash className="h-4 w-4 text-primary" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase">Plot ID</p>
                                <p className="text-sm font-bold font-mono text-primary">{autoPlotId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <Ruler className="h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase">Est. Area</p>
                                <p className="text-sm font-bold font-mono text-emerald-600">{estimatedArea.toLocaleString()} sqm</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Final area will be precisely calculated by the server using PostGIS.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-2 pt-2 space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">{error}</div>
                    )}

                    <div>
                        <label htmlFor="district" className="block text-sm font-medium mb-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            District <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="district"
                            name="district"
                            required
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="e.g. Raipur"
                            className="w-full border rounded-md p-2.5 bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="location_name" className="block text-sm font-medium mb-1">Location / Industrial Area</label>
                        <input
                            id="location_name"
                            name="location_name"
                            value={formData.location_name}
                            onChange={handleChange}
                            placeholder="e.g. Urla Industrial Area"
                            className="w-full border rounded-md p-2.5 bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none transition"
                        />
                    </div>

                    <div>
                        <label htmlFor="source" className="block text-sm font-medium mb-1">Source</label>
                        <select
                            id="source"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2.5 bg-background text-sm"
                        >
                            <option value="MANUAL">Manual Entry</option>
                            <option value="IMPORTED">Imported</option>
                            <option value="SURVEY">Field Survey</option>
                        </select>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/20 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md text-sm hover:bg-muted transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                        {isSubmitting ? "Registering..." : "Register Plot"}
                    </button>
                </div>
            </div>
        </div>
    );
}
