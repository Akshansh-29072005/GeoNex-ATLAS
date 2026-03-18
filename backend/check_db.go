package main

import (
"backend/pkg/common/db"
"backend/pkg/plots"
"fmt"
"log"

"github.com/joho/godotenv"
)

func main() {
if err := godotenv.Load(".env"); err != nil {
log.Println("No .env file found")
}
db.ConnectInput()
var count int64
db.DB.Model(&plots.Plot{}).Count(&count)
fmt.Printf("Total Plots in DB: %d\n", count)
}
