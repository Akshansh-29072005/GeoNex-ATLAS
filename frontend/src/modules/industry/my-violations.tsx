import { AlertTriangle, Download, FileText } from "lucide-react";
import type { Violation } from "@/lib/api-client";
import { violationsAPI } from "@/lib/api-client";

interface MyViolationsProps {
    violations: Violation[];
}

export function MyViolations({ violations }: MyViolationsProps) {
    if (violations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-xl bg-card">
                <div className="p-3 bg-green-100 text-green-700 rounded-full mb-3">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No Violations Detected</h3>
                <p>Your plots are fully compliant with CSIDC regulations.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {violations.map((v) => (
                <div key={v.id} className="p-4 border rounded-xl bg-card shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 text-red-700 rounded-lg mt-1">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{v.type}</h3>
                                <StatusBadge status={v.status} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                                Plot: <span className="font-mono font-medium">{v.plot_id.substring(0, 12)}</span> • Detected: {new Date(v.detected_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground max-w-xl">
                                {v.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {v.status === "NOTICE_SENT" && (
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await violationsAPI.downloadReport(v.id);
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `Notice_${v.id.substring(0, 8)}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    } catch (e) {
                                        console.error("Download failed:", e);
                                        alert("Failed to download notice.");
                                    }
                                }}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" /> Download Notice
                            </button>
                        )}
                        <button className="px-3 py-2 border rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2">
                            <FileText className="h-4 w-4" /> View Details
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        "Detected": "bg-red-100 text-red-700 border-red-200",
        "Verified": "bg-orange-100 text-orange-700 border-orange-200",
        "NOTICE_SENT": "bg-blue-100 text-blue-700 border-blue-200",
        "RESOLVED": "bg-green-100 text-green-700 border-green-200",
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}

import { CheckCircle } from "lucide-react";
