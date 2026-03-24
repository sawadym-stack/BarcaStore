package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type JSONProduct struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Img         string  `json:"img"`
	ImageURL    string  `json:"image_url"`
	Description string  `json:"description"`
	Stock       int     `json:"stock"`
	Category    string  `json:"category"`
	Gender      string  `json:"gender"`
}

type DBJson struct {
	Products []JSONProduct `json:"products"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// 1. Clear existing products
	fmt.Println("🧹 Clearing existing products...")
	db.Exec("TRUNCATE TABLE products CASCADE")

	// 2. Read db.json
	fmt.Println("📖 Reading db.json...")
	content, err := ioutil.ReadFile("frontend code/Visca Barca/barca-store/db.json")
	if err != nil {
		log.Fatal(err)
	}

	var data DBJson
	err = json.Unmarshal(content, &data)
	if err != nil {
		log.Fatal(err)
	}

	// 3. Insert new products
	fmt.Printf("🚀 Syncing %d products...\n", len(data.Products))
	for _, jp := range data.Products {
		img := jp.Img
		if img == "" {
			img = jp.ImageURL
		}

		p := entities.Product{
			ID:          jp.ID,
			Name:        jp.Name,
			Description: jp.Description,
			Price:       jp.Price,
			StockS:      jp.Stock / 4,
			StockM:      jp.Stock / 4,
			StockL:      jp.Stock / 4,
			StockXL:     jp.Stock / 4,
			Category:    jp.Category,
			Gender:      jp.Gender,
			ImageURL:    img,
		}

		if err := db.Create(&p).Error; err != nil {
			fmt.Printf("❌ Failed to insert product %d (%s): %v\n", jp.ID, jp.Name, err)
		} else {
			fmt.Printf("✅ Synced: %s\n", p.Name)
		}
	}

	fmt.Println("✅ Sync completed!")
}
