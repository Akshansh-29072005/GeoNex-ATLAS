import { useEffect, useState } from "react";
import { gisAPI, violationsAPI, type Violation } from "@/lib/api-client";
import { MapPin, Ruler, Calendar, AlertTriangle, ChevronRight } from "lucide-react";

interface PlotDetailProps {
    plotId: string | null;
    onClose: () => void;
}

interface PlotData {
    id: string;
    location_name: string;
    district: string;
    area_sqm: number;
    source: string;
    created_at: string;
    owner_name?: string;
    allotment_date?: string;
    production_deadline?: string;
}

export function PlotDetails({ plotId, onClose }: PlotDetailProps) {
    const [plot, setPlot] = useState<PlotData | null>(null);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!plotId) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const [plotRes, violRes] = await Promise.all([
                    gisAPI.getPlotById(plotId),
                    violationsAPI.getByPlot(plotId),
                ]);
                setPlot(plotRes.data);
                setViolations(violRes.data || []);
            } catch (e) {
                console.error("Failed to load plot details:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [plotId]);

    if (!plotId) return null;

    return (
        <div className="absolute right-0 top-0 h-full w-96 z-[400] bg-card border-l shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b bg-primary/5">
                <h3 className="font-bold text-lg">Plot Details</h3>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground text-xl p-1"
                >
                    &times;
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : plot ? (
                <div className="flex-1 overflow-auto p-5 space-y-5">
                    {/* Plot ID Badge */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Plot ID</p>
                            <p className="font-bold font-mono">{plot.id}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <InfoCard icon={MapPin} label="Location" value={plot.location_name || "—"} />
                        <InfoCard icon={MapPin} label="District" value={plot.district || "—"} />
                        <InfoCard icon={Ruler} label="Area" value={`${Math.round(plot.area_sqm).toLocaleString()} sqm`} />
                        <InfoCard icon={Calendar} label="Registered" value={new Date(plot.created_at).toLocaleDateString()} />
                    </div>

                    {/* Owner / Allotment Info */}
                    <div className="border rounded-lg p-4 bg-muted/10">
                        <h4 className="font-semibold text-sm mb-3">Ownership Details</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Owner Name</span>
                                <span className="font-medium">{plot.owner_name || "System / Available"}</span>
                            </div>
                            {plot.allotment_date && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Allotment Date</span>
                                        <span>{new Date(plot.allotment_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Deadline</span>
                                        <span>{plot.production_deadline ? new Date(plot.production_deadline).toLocaleDateString() : "—"}</span>
                                    </div>
                                </>
                            )}
                            {!plot.allotment_date && (
                                <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 text-center">
                                    Available for Allotment
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Violation Status */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-red-500" /> Violations ({violations.length})
                        </h4>
                        {violations.length === 0 ? (
                            <p className="text-sm text-green-600 font-medium">✓ No violations detected</p>
                        ) : (
                            <div className="space-y-2">
                                {violations.map(v => (
                                    <div key={v.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                        <div>
                                            <p className="font-medium">{v.type}</p>
                                            <p className="text-[10px] text-muted-foreground">{v.severity} • {v.status}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Plot not found
                </div>
            )}
        </div>
    );
}

function InfoCard({ icon: Icon, label, value }: any) {
    return (
        <div className="p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Icon className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-medium">{value}</p>
        </div>
    );
}
