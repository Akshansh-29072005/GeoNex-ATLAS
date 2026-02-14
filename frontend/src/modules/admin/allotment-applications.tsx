import { useState, useEffect } from "react";
import { allotmentsAPI } from "@/lib/api-client";
import { Check, X, Eye, FileText, User } from "lucide-react";

export interface Allotment {
    id: string;
    plot_id: string;
    owner_id: string;
    status: string; // PENDING, REVIEW, APPROVED, REJECTED
    reviewed_by?: string;
    review_notes?: string;
    created_at: string;
    documents_json: string; // JSON String
    applicant_details: string; // JSON String

    // New Fields
    allotment_date?: string;
    production_status?: string; // NOT_STARTED, CONSTRUCTION, OPERATIONAL
    project_cost?: number;
    revenue_generated?: number;
    production_deadline?: string;
    lease_amount?: number;
    district?: string;
    plot?: {
        location_name?: string;
        district?: string;
        area_sqm?: number;
    };
}

export function AllotmentApplications() {
    const [applications, setApplications] = useState<Allotment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Allotment | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false); // View Details Modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false); // Review Action Modal
    const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED" | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");

    const loadApplications = async () => {
        try {
            const { data } = await allotmentsAPI.getAll();
            setApplications(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load applications:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const handleViewClick = (app: Allotment) => {
        setSelectedApp(app);
        setIsViewModalOpen(true);
    };

    const handleReviewClick = (app: Allotment, action: "APPROVED" | "REJECTED") => {
        setSelectedApp(app);
        setReviewAction(action);
        setReviewNotes("");
        setReviewModalOpen(true);
    };

    const submitReview = async () => {
        if (!selectedApp || !reviewAction) return;

        try {
            await allotmentsAPI.updateStatus(selectedApp.id, reviewAction, reviewNotes);
            setReviewModalOpen(false);
            if (isViewModalOpen) setIsViewModalOpen(false); // Close view modal if review done from there
            loadApplications();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    // Helper to parse JSON safely
    const parseJSON = (jsonString: string) => {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Land Allotment Applications</h2>
                <div className="text-sm text-muted-foreground">
                    {applications.filter(a => a.status === 'PENDING').length} Pending Review
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="p-3">Application ID</th>
                            <th className="p-3">Plot ID</th>
                            <th className="p-3">Applicant</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading applications...</td></tr>
                        ) : applications.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No applications found.</td></tr>
                        ) : (
                            applications.map((app) => {
                                const details = parseJSON(app.applicant_details);
                                return (
                                    <tr key={app.id} className="hover:bg-muted/20">
                                        <td className="p-3 font-mono text-xs">{app.id.substring(0, 8)}...</td>
                                        <td className="p-3 font-medium">{app.plot_id}</td>
                                        <td className="p-3">
                                            <div className="font-medium">{details?.full_name || "N/A"}</div>
                                            <div className="text-xs text-muted-foreground">{details?.phone || "N/A"}</div>
                                        </td>
                                        <td className="p-3">{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            <button
                                                onClick={() => handleViewClick(app)}
                                                className="p-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {app.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReviewClick(app, "APPROVED")}
                                                        className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                        title="Approve"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReviewClick(app, "REJECTED")}
                                                        className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                        title="Reject"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold">Application Details</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" /> Applicant Information
                                </h4>
                                {(() => {
                                    const details = parseJSON(selectedApp.applicant_details);
                                    if (!details) return <p className="text-sm text-muted-foreground">No details provided.</p>;
                                    return (
                                        <div className="bg-muted/10 p-4 rounded-md border space-y-2 text-sm">
                                            <div><span className="font-semibold">Name:</span> {details.full_name}</div>
                                            <div><span className="font-semibold">Email:</span> {details.email}</div>
                                            <div><span className="font-semibold">Phone:</span> {details.phone}</div>
                                            <div><span className="font-semibold">Address:</span> {details.address}</div>
                                            <div><span className="font-semibold">ID Proof:</span> {details.aadhar_pan}</div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Application Info</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold">Plot ID:</span> {selectedApp.plot_id}</div>
                                    <div><span className="font-semibold">Status:</span> {selectedApp.status}</div>
                                    <div><span className="font-semibold">Submitted:</span> {new Date(selectedApp.created_at).toLocaleString()}</div>
                                </div>

                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mt-6">Documents</h4>
                                <ul className="space-y-2 text-sm">
                                    {(() => {
                                        const docs = parseJSON(selectedApp.documents_json);
                                        const details = parseJSON(selectedApp.applicant_details);
                                        if (!Array.isArray(docs)) return <li>No documents.</li>;
                                        return docs.map((doc: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 p-2 border rounded bg-background">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <span className="truncate flex-1">{doc} {details?.id_proof_file === doc && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded ml-2">ID PROOF</span>}</span>
                                                <button className="text-xs text-primary hover:underline">View</button>
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            </div>
                        </div>

                        {selectedApp.status === 'PENDING' && (
                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => handleReviewClick(selectedApp, "REJECTED")}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                                >
                                    Reject Application
                                </button>
                                <button
                                    onClick={() => handleReviewClick(selectedApp, "APPROVED")}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                >
                                    Approve Application
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Review Modal (Same as before) */}
            {reviewModalOpen && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">
                            {reviewAction === 'APPROVED' ? 'Approve Application' : 'Reject Application'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You are about to {reviewAction?.toLowerCase()} the application for Plot <strong>{selectedApp.plot_id}</strong>.
                        </p>

                        <label className="block text-sm font-medium mb-2">Review Notes</label>
                        <textarea
                            className="w-full border rounded-md p-2 text-sm bg-background mb-4"
                            rows={4}
                            placeholder="Enter reason or notes..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setReviewModalOpen(false)}
                                className="px-4 py-2 border rounded hover:bg-muted text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReview}
                                className={`px-4 py-2 rounded text-white text-sm font-medium ${reviewAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                Confirm {reviewAction === 'APPROVED' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
