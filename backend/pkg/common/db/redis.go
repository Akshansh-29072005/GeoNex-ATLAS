package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func ConnectRedis() {
	host := os.Getenv("REDIS_HOST")
	if host == "" {
		host = "localhost"
	}
	addr := fmt.Sprintf("%s:6379", host)

	RDB = redis.NewClient(&redis.Options{
		Addr: addr,
	})

	if err := RDB.Ping(context.Background()).Err(); err != nil {
		log.Printf("⚠️  Failed to connect to Redis: %v (OTP features might fail)", err)
		return
	}

	log.Println("Connected to Redis successfully")
}
