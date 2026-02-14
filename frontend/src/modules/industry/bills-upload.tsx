import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export function BillsUpload({ allotments }: { allotments: any[] }) {
    const [selectedAllotment, setSelectedAllotment] = useState(allotments.length > 0 ? allotments[0].id : "");
    const [month, setMonth] = useState("");
    const [units, setUnits] = useState("");
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        // Mock API Call
        setTimeout(() => {
            setUploading(false);
            setSuccess(true);
            // Reset form after 2 seconds
            setTimeout(() => setSuccess(false), 3000);
        }, 1500);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Upload Electricity Bill</h3>
                    <p className="text-sm text-muted-foreground">
                        Regular upload of electricity bills helps in verifying your production status and maintaining compliance.
                    </p>
                </div>

                <form onSubmit={handleUpload} className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Plot / Unit</label>
                        <select
                            className="w-full p-2 border rounded-md bg-background"
                            value={selectedAllotment}
                            onChange={(e) => setSelectedAllotment(e.target.value)}
                            required
                        >
                            <option value="">Select Plot</option>
                            {allotments.map(a => (
                                <option key={a.id} value={a.id}>{a.plot_id} - {a.plot?.location_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Month</label>
                            <select
                                className="w-full p-2 border rounded-md bg-background"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                required
                            >
                                <option value="">Select Month</option>
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Year</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md bg-background"
                                defaultValue={new Date().getFullYear()}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Units Consumed (kWh)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="e.g. 4500"
                                value={units}
                                onChange={(e) => setUnits(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bill Amount (₹)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="e.g. 50000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bill Document (PDF/Image)</label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PDF, JPG or PNG (MAX. 5MB)</p>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            />
                        </div>
                        {file && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                                <FileText className="h-4 w-4" />
                                {file.name}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || success}
                        className={`w-full py-2 rounded-lg font-medium text-white transition flex items-center justify-center gap-2 ${success ? 'bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
                    >
                        {uploading ? (
                            "Uploading..."
                        ) : success ? (
                            <>
                                <CheckCircle className="h-4 w-4" /> Uploaded Successfully
                            </>
                        ) : (
                            "Submit Bill"
                        )}
                    </button>
                </form>
            </div>

            {/* Right Side Info */}
            <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl dark:bg-blue-900/10 dark:border-blue-900/30">
                    <h4 className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        <AlertCircle className="h-5 w-5" /> Why upload bills?
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                        Electricity consumption data is a key indicator of your industry's operational status. Consistent uploads help prevent:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-1">
                        <li>False "Non-Operational" flags</li>
                        <li>Unnecessary field inspections</li>
                        <li>Notices for dormancy</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-3">Recent Uploads</h4>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">March 2025 Bill</p>
                                        <p className="text-xs text-muted-foreground">IND-A-102 • 12,500 kWh</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Verified</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
