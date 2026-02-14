package reports

import "time"

type ComplianceStats struct {
	TotalChecks     int64            `json:"total_checks"`
	CompliantUnits  int64            `json:"compliant_units"`
	NearDeadline    int64            `json:"near_deadline"`
	OverdueChecks   int64            `json:"overdue_checks"`
	ViolationByType map[string]int64 `json:"violation_by_type"`
}

type ComplianceItem struct {
	PlotID          string    `json:"plot_id"`
	OwnerName       string    `json:"owner_name"`       // Company Name
	RiskFactor      string    `json:"risk_factor"`      // Low, Medium, High
	ComplianceScore int       `json:"compliance_score"` // 0-100
	Deadline        string    `json:"deadline"`         // Formatted date
	DaysLeft        int       `json:"days_left"`        // Negative if overdue
	Status          string    `json:"status"`           // Compliant, Near Deadline, Overdue
	LastInspected   time.Time `json:"last_inspected"`
	ViolationType   string    `json:"violation_type,omitempty"`
	ViolationDesc   string    `json:"violation_desc,omitempty"`
	ReportedBy      string    `json:"reported_by,omitempty"`
}
