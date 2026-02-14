import { useState, useEffect } from "react";
import { plotsAPI, violationsAPI } from "@/lib/api-client";
import { X } from "lucide-react";

interface CreateViolationForm {
    plot_id: string;
    type: string;
    severity: string;
    description: string;
    confidence_score: number;
    image_before_url: string;
    image_after_url: string;
}

const INITIAL_STATE: CreateViolationForm = {
    plot_id: "",
    type: "ENCROACHMENT",
    severity: "Low",
    description: "",
    confidence_score: 95.0,
    image_before_url: "",
    image_after_url: "",
};

export function CreateViolationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState<CreateViolationForm>(INITIAL_STATE);
    const [plots, setPlots] = useState<{ id: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        plotsAPI.getAll().then((res) => setPlots(res.data));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "confidence_score" ? Number(value) : value
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!formData.plot_id) {
                setError("Plot ID is required");
                setLoading(false);
                return;
            }
            await violationsAPI.create(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to create violation:", err);
            setError(err.response?.data?.error || "Failed to create violation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-lg overflow-hidden border">
                <div className="flex justify-between items-center p-4 border-b bg-muted/40">
                    <h2 className="text-lg font-semibold">Report New Violation</h2>
                    <button onClick={onClose} className="hover:bg-muted p-1 rounded"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={onSubmit} className="p-4 space-y-4">
                    {error && <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Plot ID <span className="text-destructive">*</span></label>
                            <select
                                name="plot_id"
                                value={formData.plot_id}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                                required
                            >
                                <option value="">Select Plot</option>
                                {plots.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Violation Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            >
                                <option value="ENCROACHMENT">Encroachment</option>
                                <option value="GREEN_COVER">Green Cover Loss</option>
                                <option value="UNAUTHORIZED_CONSTRUCTION">Unauthorized Construction</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Severity</label>
                            <select
                                name="severity"
                                value={formData.severity}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confidence Score (0-100)</label>
                            <input
                                type="number"
                                name="confidence_score"
                                value={formData.confidence_score}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-full border rounded-md p-2 text-sm bg-background"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border rounded-md p-2 text-sm bg-background"
                            rows={3}
                            placeholder="Describe the violation..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Before Image URL</label>
                            <input
                                name="image_before_url"
                                value={formData.image_before_url}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">After Image URL</label>
                            <input
                                name="image_after_url"
                                value={formData.image_after_url}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 text-sm bg-background"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t mt-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm font-medium disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Reporting..." : "Report Violation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
