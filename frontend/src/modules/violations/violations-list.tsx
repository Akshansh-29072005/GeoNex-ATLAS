import { useState, useEffect } from "react";
import { ImageComparisonSlider } from "./components/image-comparison";
import {
    AlertCircle, Clock, Shield, Target, TreePine, Factory, FileWarning,
    Send, UserCheck, Plane, CheckCircle, XCircle, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { violationsAPI, type Violation } from "@/lib/api-client";
import { CreateViolationModal } from "./create-violation-modal";

export function ViolationsList() {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTimeline, setShowTimeline] = useState(true);

    const loadViolations = async () => {
        try {
            const { data } = await violationsAPI.getAll();
            setViolations(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load violations:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadViolations();
    }, []);

    const filteredViolations = filter === "All"
        ? violations
        : violations.filter(v => v.status === filter);

    const riskScore = selectedViolation
        ? Math.round(selectedViolation.confidence_score || 78)
        : 0;

    const riskLevel = riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 40 ? "Moderate" : "Low";
    const riskColor = riskScore >= 80 ? "text-red-600" : riskScore >= 60 ? "text-orange-500" : riskScore >= 40 ? "text-yellow-500" : "text-green-500";
    const riskBgColor = riskScore >= 80 ? "bg-red-500" : riskScore >= 60 ? "bg-orange-500" : riskScore >= 40 ? "bg-yellow-500" : "bg-green-500";

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 p-2">
            {/* LEFT: Violations List */}
            <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Violations</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-destructive text-destructive-foreground px-3 py-1 text-xs rounded-md hover:bg-destructive/90"
                        >
                            + Report
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 text-[10px] font-bold">
                    {["All", "Detected", "Verified", "Notice Sent"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2 py-1 rounded-full border transition ${filter === f
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-muted text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {f} {f === "All" ? `(${violations.length})` : `(${violations.filter(v => v.status === f).length})`}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-auto space-y-2 pr-1">
                    {loading ? (
                        <p className="text-center text-muted-foreground p-4">Loading violations...</p>
                    ) : filteredViolations.length === 0 ? (
                        <p className="text-center text-muted-foreground p-4">No violations found</p>
                    ) : (
                        filteredViolations.map((violation) => (
                            <div
                                key={violation.id}
                                onClick={() => setSelectedViolation(violation)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary ${selectedViolation?.id === violation.id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "bg-card shadow-sm"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-xs font-mono">{violation.plot_id.substring(0, 12)}</span>
                                    <StatusBadge status={violation.status} />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                                    {violation.plot?.location_name || "Unknown"} • {violation.severity}
                                </p>
                                <h3 className="font-medium text-sm text-foreground mb-1">{violation.type}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(violation.detected_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Detail Section */}
            <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
                {selectedViolation ? (
                    <div className="h-full flex flex-col overflow-auto">
                        {/* Top Header */}
                        <div className="px-6 py-4 border-b bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">Plot {selectedViolation.plot_id.substring(0, 12)}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        AI-powered violation detection with risk scoring
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${riskBgColor} text-white`}>
                                    {riskLevel}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="flex-1 overflow-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                                {/* Left Column: Risk + AI */}
                                <div className="lg:col-span-3 border-r p-4 space-y-4">
                                    {/* Risk Score Gauge */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-32 h-32">
                                            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                                                <circle
                                                    cx="60" cy="60" r="50" fill="none"
                                                    strokeWidth="8"
                                                    strokeDasharray={`${(riskScore / 100) * 314} 314`}
                                                    strokeLinecap="round"
                                                    className={riskColor}
                                                    stroke="currentColor"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold">{riskScore}</span>
                                                <span className="text-[10px] text-muted-foreground">Risk Score</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{riskScore} / 100</p>
                                    </div>

                                    {/* Risk Details */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold flex items-center gap-1">
                                            <Shield className="h-3 w-3" /> Risk Details
                                        </h4>
                                        <RiskItem
                                            icon={Target}
                                            label="Violation Type"
                                            value={selectedViolation.type}
                                            color="text-red-500"
                                        />
                                        <RiskItem
                                            icon={TreePine}
                                            label="Severity"
                                            value={selectedViolation.severity}
                                            color={selectedViolation.severity === "High" ? "text-red-600" : "text-yellow-500"}
                                        />
                                        <RiskItem
                                            icon={Factory}
                                            label="Location"
                                            value={selectedViolation.plot?.location_name || "Unknown"}
                                            color="text-blue-500"
                                        />
                                    </div>

                                    {/* AI Explanation */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <h4 className="text-sm font-semibold flex items-center gap-1">
                                            <FileWarning className="h-3 w-3" /> AI Explanation
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {selectedViolation.description || "No AI analysis available for this violation."}
                                        </p>
                                    </div>
                                </div>

                                {/* CENTER: Evidence */}
                                <div className="lg:col-span-6 p-4 space-y-4 border-r">
                                    <h3 className="text-sm font-semibold">Evidence Comparison</h3>
                                    <ImageComparisonSlider
                                        beforeImage={selectedViolation.image_before_url}
                                        afterImage={selectedViolation.image_after_url}
                                        beforeLabel="Before — Reference"
                                        afterLabel="After — Satellite"
                                    />
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        Drag slider to compare baseline vs latest satellite imagery
                                    </p>

                                    {/* Comparison Analysis */}
                                    {selectedViolation.comparison_image_url && (
                                        <div className="pt-2 border-t">
                                            <h4 className="text-xs font-semibold mb-2">AI Difference Analysis</h4>
                                            <div className="rounded-md border overflow-hidden bg-black/5">
                                                <img
                                                    src={selectedViolation.comparison_image_url}
                                                    alt="Difference Analysis"
                                                    className="w-full h-auto object-contain max-h-48"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 text-center">
                                                Highlighted areas indicate detected structural changes (Red/White pixels).
                                            </p>
                                        </div>
                                    )}

                                    {/* Violation Timeline */}
                                    <div className="border-t pt-4">
                                        <button
                                            onClick={() => setShowTimeline(!showTimeline)}
                                            className="flex items-center justify-between w-full text-sm font-semibold mb-3"
                                        >
                                            Violation Details
                                            {showTimeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                        {showTimeline && (
                                            <div className="space-y-3">
                                                <TimelineStep
                                                    icon={AlertCircle}
                                                    label="Detected"
                                                    date={new Date(selectedViolation.detected_at).toLocaleDateString()}
                                                    color="text-red-500"
                                                    active
                                                />
                                                <TimelineStep
                                                    icon={UserCheck}
                                                    label="Reviewed by GIS Officer"
                                                    date={selectedViolation.status !== "Detected" ? new Date(selectedViolation.detected_at).toLocaleDateString() : "Pending"}
                                                    color={selectedViolation.status !== "Detected" ? "text-green-500" : "text-muted-foreground"}
                                                    active={selectedViolation.status !== "Detected"}
                                                />
                                                <TimelineStep
                                                    icon={Send}
                                                    label="Notice Issued"
                                                    date={selectedViolation.status === "Notice Sent" ? "Sent" : "Pending"}
                                                    color={selectedViolation.status === "Notice Sent" ? "text-blue-500" : "text-muted-foreground"}
                                                    active={selectedViolation.status === "Notice Sent"}
                                                />
                                                <TimelineStep
                                                    icon={CheckCircle}
                                                    label="Field Verified / Case Closed"
                                                    date="Pending"
                                                    color="text-muted-foreground"
                                                    active={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT Sidebar: Plot Info + Actions */}
                                <div className="lg:col-span-3 p-4 space-y-4">
                                    {/* Plot Info */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold">Plot Info</h4>
                                        <div className="space-y-2 text-xs">
                                            <InfoRow label="Plot ID" value={selectedViolation.plot_id.substring(0, 12)} />
                                            <InfoRow label="Location" value={selectedViolation.plot?.location_name || "N/A"} />
                                            <InfoRow label="District" value={selectedViolation.plot?.district || "N/A"} />
                                            <InfoRow label="Detected" value={new Date(selectedViolation.detected_at).toLocaleDateString()} />
                                            <InfoRow label="Confidence" value={`${selectedViolation.confidence_score}%`} />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <h4 className="text-sm font-semibold">Actions</h4>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await violationsAPI.downloadReport(selectedViolation.id);
                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `Violation_Report_${selectedViolation.id.substring(0, 8)}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                } catch (e) {
                                                    console.error("Download failed:", e);
                                                }
                                            }}
                                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Download className="h-3 w-3" /> Download Official Report
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await violationsAPI.generateNotice(selectedViolation.id);
                                                    alert("Official Notice Generated & Sent!");
                                                    loadViolations();
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Failed to generate notice");
                                                }
                                            }}
                                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                        >
                                            <Send className="h-3 w-3" /> Generate Notice
                                        </button>
                                        <button
                                            onClick={async () => {
                                                // Mock assignment for now
                                                try {
                                                    // const mockOfficerId = "00000000-0000-0000-0000-000000000000"; // not used currently
                                                    // In real app, open a modal to select officer
                                                    await violationsAPI.assignOfficer(selectedViolation.id, "123e4567-e89b-12d3-a456-426614174000"); // Mock UUID
                                                    alert("Field Officer Assigned!");
                                                    loadViolations();
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Failed to assign officer");
                                                }
                                            }}
                                            className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2">
                                            <UserCheck className="h-3 w-3" /> Assign Field Officer
                                        </button>
                                        <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2">
                                            <Plane className="h-3 w-3" /> Recommend Drone Survey
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await violationsAPI.verify(selectedViolation.id);
                                                    alert("Violation Verified!");
                                                    loadViolations();
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Failed to verify violation");
                                                }
                                            }}
                                            className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-3 w-3" /> Mark as Verified
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await violationsAPI.closeCase(selectedViolation.id);
                                                    alert("Case Closed!");
                                                    loadViolations();
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Failed to close case");
                                                }
                                            }}
                                            className="w-full py-2 border rounded-lg text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-2">
                                            <XCircle className="h-3 w-3" /> Close Case
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>Select a violation to view details</p>
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateViolationModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { loadViolations(); }}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        "Detected": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
        "Verified": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
        "Notice Sent": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
        "NOTICE_SENT": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    };

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}

function RiskItem({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex items-start gap-2">
            <Icon className={`h-3 w-3 mt-0.5 ${color}`} />
            <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-medium">{value}</p>
            </div>
        </div>
    );
}

function TimelineStep({ icon: Icon, label, date, color, active }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${active ? 'bg-current/10' : 'bg-muted'}`}>
                <Icon className={`h-3 w-3 ${color}`} />
            </div>
            <div className="flex-1 flex justify-between items-center">
                <span className={`text-xs ${active ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                <span className="text-[10px] text-muted-foreground">{date}</span>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium font-mono">{value}</span>
        </div>
    );
}
