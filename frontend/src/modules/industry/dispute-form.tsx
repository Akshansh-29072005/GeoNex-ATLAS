import { useState } from "react";
import { Upload, X, MapPin } from "lucide-react";
// import { useUIStore } from "@/lib/store";

export function IndustryDisputeForm({ onClose }: { onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Mock API call
        setTimeout(() => {
            setIsSubmitting(false);
            onClose();
            alert("Dispute ticket raised successfully! Ticket ID: TKT-2026-889");
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-lg overflow-hidden border">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold text-lg">Raise Violation Dispute</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                        <X className="h-5 w-5 opacity-70" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Plot</label>
                        <select className="w-full border rounded-md p-2 text-sm bg-background">
                            <option>P-402 (Urla Industrial Area) - Encroachment</option>
                            <option>P-118 (Siltara) - Green Cover Loss</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason for Dispute</label>
                        <textarea
                            className="w-full border rounded-md p-2 text-sm bg-background h-24 resize-none"
                            placeholder="Describe why the violation notice is incorrect..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">Evidence Upload</label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Click to upload Geotagged Photos</p>
                            <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG (Max 5MB)</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                            <MapPin className="h-3 w-3" />
                            <span>Photos must contain GPS metadata</span>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Dispute Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
