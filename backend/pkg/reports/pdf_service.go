package reports

import (
	"backend/pkg/plots"
	"backend/pkg/violations"
	"fmt"
	"time"

	"github.com/johnfercher/maroto/pkg/color"
	"github.com/johnfercher/maroto/pkg/consts"
	"github.com/johnfercher/maroto/pkg/pdf"
	"github.com/johnfercher/maroto/pkg/props"
)

type PDFService interface {
	GenerateViolationReport(v *violations.Violation, p *plots.Plot, ownerName string) ([]byte, error)
}

type pdfService struct{}

func NewPDFService() PDFService {
	return &pdfService{}
}

func (s *pdfService) GenerateViolationReport(v *violations.Violation, p *plots.Plot, ownerName string) ([]byte, error) {
	m := pdf.NewMaroto(consts.Portrait, consts.A4)
	m.SetPageMargins(20, 10, 20)

	// Header
	m.RegisterHeader(func() {
		m.Row(20, func() {
			m.Col(12, func() {
				m.Text("CSIDC Automated Satellite Monitoring System", props.Text{
					Size:  14,
					Style: consts.Bold,
					Align: consts.Center,
					Color: color.Color{Red: 0, Green: 0, Blue: 255},
					Top:   5,
				})
				m.Text("Official Violation Report", props.Text{
					Size:  10,
					Style: consts.Normal,
					Align: consts.Center,
					Top:   12,
				})
			})
		})
	})

	// Footer
	m.RegisterFooter(func() {
		m.Row(10, func() {
			m.Col(12, func() {
				m.Text(fmt.Sprintf("Generated on %s", time.Now().Format("02 Jan 2006 15:04")), props.Text{
					Size:  8,
					Align: consts.Right,
					Color: color.Color{Red: 100, Green: 100, Blue: 100},
				})
			})
		})
	})

	// Content
	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("Violation Details", props.Text{
				Size:  12,
				Style: consts.Bold,
				Color: color.Color{Red: 0, Green: 0, Blue: 0},
			})
		})
	})

	m.Row(6, func() {
		m.Col(4, func() { m.Text("Violation ID:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.ID.String()) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Violation Type:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.Type) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Severity:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.Severity) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Status:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.Status) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Detected At:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.DetectedAt.Format("02 Jan 2006")) })
	})

	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("Plot Information", props.Text{
				Size:  12,
				Style: consts.Bold,
				Top:   5,
			})
		})
	})

	m.Row(6, func() {
		m.Col(4, func() { m.Text("Plot ID:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(p.ID) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Owner Name:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(ownerName) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Location:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(fmt.Sprintf("%s, %s", p.LocationName, p.District)) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Area:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(fmt.Sprintf("%.2f Sq.m", p.AreaSqm)) })
	})

	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("Evidence", props.Text{
				Size:  12,
				Style: consts.Bold,
				Top:   5,
			})
		})
	})

	// Description
	m.Row(20, func() {
		m.Col(12, func() {
			m.Text(v.Description, props.Text{
				Size: 10,
			})
		})
	})

	// Links to images (since we can't easily embed remote URLs without downloading first in maroto/gofpdf without helper)
	// For now, listing URLs. In production we would download and embed.
	m.Row(6, func() {
		m.Col(4, func() { m.Text("Before Image:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.ImageBeforeURL, props.Text{Size: 8, Color: color.Color{Red: 0, Green: 0, Blue: 255}}) })
	})
	m.Row(6, func() {
		m.Col(4, func() { m.Text("After Image:", props.Text{Style: consts.Bold}) })
		m.Col(8, func() { m.Text(v.ImageAfterURL, props.Text{Size: 8, Color: color.Color{Red: 0, Green: 0, Blue: 255}}) })
	})

	buff, err := m.Output()
	if err != nil {
		return nil, err
	}
	return buff.Bytes(), nil
}
