package main

import (
	"backend/pkg/allotments"
	"backend/pkg/common/db"
	"backend/pkg/plots"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")
	db.ConnectInput()

	log.Println("🔧 Starting Data Repair...")

	// 1. Repair Plot Ownership based on Allotments
	var apps []allotments.Allotment
	db.DB.Where("status = ?", "APPROVED").Find(&apps)
	log.Printf("Found %d approved allotments", len(apps))

	for _, app := range apps {
		log.Printf("Syncing Plot %s to Owner %s", app.PlotID, app.OwnerID)
		err := db.DB.Model(&plots.Plot{}).Where("id = ?", app.PlotID).Update("owner_id", app.OwnerID).Error
		if err != nil {
			log.Printf("❌ Failed to update owner: %v", err)
		}
	}

	// 2. Repair Plot Area (Recalculate if 0)
	var plotList []plots.Plot
	db.DB.Find(&plotList)
	for _, p := range plotList {
		if p.AreaSqm == 0 {
			log.Printf("Recalculating Area for Plot %s", p.ID)
			// Use Raw SQL to update area from Geometry
			err := db.DB.Exec("UPDATE plots SET area_sqm = ST_Area(geom::geography) WHERE id = ?", p.ID).Error
			if err != nil {
				log.Printf("❌ Failed to recalculate area: %v", err)
			}
		}
		// Fix Location Name if missing (Default to District + ID)
		if p.LocationName == "" || p.LocationName == "—" {
			log.Printf("Fixing Location for Plot %s", p.ID)
			db.DB.Model(&p).Update("location_name", "Industrial Area "+p.District)
		}
	}

	log.Println("✅ validaton/repair script complete.")
}
