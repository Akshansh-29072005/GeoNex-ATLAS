import { useState, useEffect } from "react";
import { allotmentsAPI, plotsAPI } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { CheckCircle, Upload, Search, FileText, ArrowRight, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AllotmentWizard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [step, setStep] = useState(1);
    const [plots, setPlots] = useState<any[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Applicant Details
    const [applicantDetails, setApplicantDetails] = useState({
        full_name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: "",
        aadhar_pan: "",
    });

    // Documents
    const [documents, setDocuments] = useState<string[]>([]);
    const [idProof, setIdProof] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPlots();
    }, []);

    const loadPlots = async () => {
        try {
            const res = await plotsAPI.getAll();
            setPlots(res.data || []);
        } catch (error) {
            console.error("Failed to load plots", error);
        }
    };

    const filteredPlots = plots.filter(p =>
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpload = (type: 'doc' | 'id') => {
        // Stub for file upload
        const fakeDoc = type === 'id' ? `ID_Proof_${Date.now()}.jpg` : `Document_${documents.length + 1}.pdf`;
        if (type === 'id') {
            setIdProof(fakeDoc);
        } else {
            setDocuments([...documents, fakeDoc]);
        }
    };

    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setApplicantDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!selectedPlot) return;
        setIsSubmitting(true);
        try {
            // Combine ID Proof into documents list for backend storage if needed, 
            // but we kept separate field ApplicantDetails. 
            // Let's store ID proof name in ApplicantDetails or Documents.
            // Requirement: "ID proofs"

            const finalDocs = [...documents];
            if (idProof) finalDocs.push(idProof);

            await allotmentsAPI.apply({
                plot_id: selectedPlot.id,
                documents_json: JSON.stringify(finalDocs),
                applicant_details: JSON.stringify({
                    ...applicantDetails,
                    id_proof_file: idProof
                }),
            });
            alert("Application Submitted Successfully!");
            navigate("/industry");
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-background text-foreground">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Land Allotment Application</h1>
                <p className="text-muted-foreground">Apply for industrial land allocation in 4 easy steps.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between relative max-w-3xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10"></div>
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`flex flex-col items-center gap-2 bg-background px-4 ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${s <= step ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-muted'}`}>
                            {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        <span className="text-sm font-medium">
                            {s === 1 ? "Select Plot" : s === 2 ? "Applicant Details" : s === 3 ? "Documents" : "Review"}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Select an Available Plot</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search by ID or Location..."
                                    className="pl-8 w-full border rounded-md p-2 text-sm bg-background"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
                            {filteredPlots.map((plot) => (
                                <div
                                    key={plot.id}
                                    onClick={() => setSelectedPlot(plot)}
                                    className={`cursor-pointer border rounded-lg p-4 transition-colors hover:border-primary/50 relative overflow-hidden ${selectedPlot?.id === plot.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-lg">{plot.id}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${plot.status === 'COMPLIANT' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'}`}>
                                            {plot.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{plot.location_name || "Unknown Location"}</p>
                                    <div className="flex justify-between items-end mt-4">
                                        <span className="text-xs font-mono">{plot.area_sqm} sqm</span>
                                        {selectedPlot?.id === plot.id && <CheckCircle className="h-5 w-5 text-primary" />}
                                    </div>
                                    {plot.district && (
                                        <span className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-secondary px-1 rounded">{plot.district}</span>
                                    )}
                                </div>
                            ))}
                            {filteredPlots.length === 0 && (
                                <p className="col-span-full text-center text-muted-foreground py-12">No plots found.</p>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Applicant Information</h2>
                            <p className="text-muted-foreground text-sm">Please provide your personal and contact details.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <input name="full_name" value={applicantDetails.full_name} onChange={handleApplicantChange} className="w-full border rounded-md p-2 bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input name="email" value={applicantDetails.email} onChange={handleApplicantChange} className="w-full border rounded-md p-2 bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <input name="phone" value={applicantDetails.phone} onChange={handleApplicantChange} className="w-full border rounded-md p-2 bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Aadhar / PAN Number</label>
                                <input name="aadhar_pan" value={applicantDetails.aadhar_pan} onChange={handleApplicantChange} placeholder="Enter ID Number" className="w-full border rounded-md p-2 bg-background" />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-medium">Full Address</label>
                                <textarea name="address" rows={3} value={applicantDetails.address} onChange={handleApplicantChange} className="w-full border rounded-md p-2 bg-background" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-semibold">Upload Documents</h2>
                            <p className="text-muted-foreground text-sm">Upload ID Proof and other relevant documents.</p>
                        </div>

                        {/* ID Proof Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID Proof (Aadhar/Passport/PAN)</label>
                            <div className="border border-dashed rounded-lg p-4 flex items-center justify-between bg-muted/20">
                                {idProof ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>{idProof}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No file selected</span>
                                )}
                                <button
                                    onClick={() => handleUpload('id')}
                                    className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded"
                                >
                                    {idProof ? "Change" : "Upload ID"}
                                </button>
                            </div>
                        </div>

                        {/* Other Documents */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Other Documents (Project Report, Financials)</label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-muted/20">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <button
                                    onClick={() => handleUpload('doc')}
                                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
                                >
                                    Add Document
                                </button>
                            </div>
                            {documents.length > 0 && (
                                <ul className="space-y-2 mt-4">
                                    {documents.map((doc, i) => (
                                        <li key={i} className="flex items-center gap-3 p-2 border rounded-md bg-background text-sm">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="flex-1">{doc}</span>
                                            <button
                                                onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))}
                                                className="text-xs text-destructive hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-semibold text-center">Review Application</h2>

                        <div className="grid gap-6 border rounded-lg p-6 bg-muted/10">
                            {/* Applicant Info */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                                    <User className="h-3 w-3" /> Applicant
                                </label>
                                <div className="font-medium text-lg">{applicantDetails.full_name}</div>
                                <div className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground pt-1">
                                    <span>{applicantDetails.email}</span>
                                    <span>{applicantDetails.phone}</span>
                                    <span>ID: {applicantDetails.aadhar_pan || "N/A"}</span>
                                    <span className="truncate">{applicantDetails.address}</span>
                                </div>
                            </div>

                            <div className="h-px bg-border"></div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Selected Plot</label>
                                <div className="font-medium text-lg">{selectedPlot?.id}</div>
                                <div className="text-sm text-muted-foreground">{selectedPlot?.location_name}</div>
                            </div>

                            <div className="h-px bg-border"></div>

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Attached Files</label>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {idProof && <li><strong>ID Proof:</strong> {idProof}</li>}
                                    {documents.map((doc, i) => (
                                        <li key={i}>{doc}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-4 text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Note:</strong> Submitted applications require manual verification by CSIDC officials. You will be notified via email/SMS.
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {step < 4 ? (
                    <button
                        onClick={() => {
                            if (step === 1 && !selectedPlot) {
                                alert("Please select a plot first.");
                                return;
                            }
                            if (step === 2 && (!applicantDetails.full_name || !applicantDetails.phone)) {
                                alert("Please fill in required applicant details.");
                                return;
                            }
                            setStep(s => s + 1);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        Next Step <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-200"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                    </button>
                )}
            </div>
        </div>
    );
}
