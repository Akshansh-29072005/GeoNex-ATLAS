import { useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../components/ui/table";
import {
    CheckCircle, AlertTriangle, AlertCircle, Download, FileOutput, ChevronLeft, ChevronRight, Search
} from "lucide-react";
import type { Allotment } from "./allotment-applications";

// Mock data generator or interface extension if needed
interface LeaseRecord {
    id: string;
    plot_id: string;
    allottee: string;
    lease_start: string;
    lease_end: string;
    annual_rent: number;
    water_charge: number;
    due_amount: number;
    status: "Paid" | "Due Soon" | "Overdue";
    years_left: number;
}

// Helper to format currency in Indian Lakh notation if possible, or just standard INR
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export function LeaseRecordsTable({ allotments }: { allotments: Allotment[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [searchTerm, setSearchTerm] = useState("");

    // Transform Allotments to Lease Records (Mocking missing data for UI demo)
    const records: LeaseRecord[] = allotments.length > 0 ? allotments.map((a, i) => {
        // Deterministic mock data based on index
        const status = i % 3 === 0 ? "Paid" : i % 3 === 1 ? "Due Soon" : "Overdue";
        const dueAmount = status === "Paid" ? 0 : status === "Due Soon" ? 15000 : 125000;
        const rent = 500000 + (i * 10000);

        return {
            id: a.id,
            plot_id: a.plot_id,
            allottee: (() => {
                try {
                    const details = JSON.parse(a.applicant_details);
                    return details?.full_name || "Unknown Allottee";
                } catch {
                    return "Unknown Company";
                }
            })(),
            lease_start: "2023",
            lease_end: "2053",
            annual_rent: rent,
            water_charge: 12000,
            due_amount: dueAmount,
            status: status,
            years_left: 27
        };
    }) : [
        // Fallback mock data if no allotments exist yet
        { id: "1", plot_id: "IND-A-101", allottee: "TechNova Systems", lease_start: "2020", lease_end: "2050", annual_rent: 1200000, water_charge: 25000, due_amount: 0, status: "Paid", years_left: 24 },
        { id: "2", plot_id: "IND-B-205", allottee: "GreenEnergy Corp", lease_start: "2022", lease_end: "2052", annual_rent: 850000, water_charge: 15000, due_amount: 45000, status: "Due Soon", years_left: 26 },
        { id: "3", plot_id: "IND-C-310", allottee: "AutoAncillary Ltd", lease_start: "2019", lease_end: "2049", annual_rent: 2400000, water_charge: 40000, due_amount: 2440000, status: "Overdue", years_left: 23 },
        { id: "4", plot_id: "IND-A-102", allottee: "BioHealth Pharma", lease_start: "2021", lease_end: "2051", annual_rent: 1500000, water_charge: 30000, due_amount: 0, status: "Paid", years_left: 25 },
        { id: "5", plot_id: "IND-D-401", allottee: "SteelWorks India", lease_start: "2018", lease_end: "2048", annual_rent: 3200000, water_charge: 55000, due_amount: 0, status: "Paid", years_left: 22 },
        { id: "6", plot_id: "IND-B-206", allottee: "LogiTech Warehousing", lease_start: "2023", lease_end: "2053", annual_rent: 900000, water_charge: 18000, due_amount: 150000, status: "Overdue", years_left: 27 },
    ];

    const filteredRecords = records.filter(r =>
        r.plot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.allottee.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold">Lease Records</h2>
                    <p className="text-sm text-muted-foreground">Manage ongoing leases, rent collections, and dues.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search Plot ID or Allottee..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border rounded-lg hover:bg-muted text-muted-foreground transition">
                        <FileOutput className="h-4 w-4" />
                    </button>
                    <button className="p-2 border rounded-lg hover:bg-muted text-muted-foreground transition">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-bold">Plot ID</TableHead>
                            <TableHead>Allottee</TableHead>
                            <TableHead>Lease Period</TableHead>
                            <TableHead className="text-right">Annual Rent</TableHead>
                            <TableHead className="text-right">Water Charge</TableHead>
                            <TableHead className="text-right">Due Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Years Left</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.length > 0 ? (
                            paginatedRecords.map((record) => (
                                <TableRow key={record.id} className="hover:bg-muted/50 transition">
                                    <TableCell className="font-mono font-bold">{record.plot_id.substring(0, 12)}</TableCell>
                                    <TableCell className="font-medium">{record.allottee}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{record.lease_start} — {record.lease_end}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(record.annual_rent)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(record.water_charge)}</TableCell>
                                    <TableCell className={`text-right font-medium ${record.due_amount === 0 ? "text-green-600" :
                                        record.due_amount < 50000 ? "text-amber-600" : "text-destructive"
                                        }`}>
                                        {formatCurrency(record.due_amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <StatusBadge status={record.status} />
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">{record.years_left}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No records found matching your search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + pageSize, filteredRecords.length)}</span> of <span className="font-medium">{filteredRecords.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded text-xs font-medium transition ${currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground"
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "Paid") {
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Paid
            </div>
        );
    }
    if (status === "Due Soon") {
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                <AlertCircle className="w-3 h-3 mr-1" /> Due Soon
            </div>
        );
    }
    return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
        </div>
    );
}
