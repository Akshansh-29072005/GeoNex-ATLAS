package notifications

import (
	"backend/pkg/common/db"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Notification model
type Notification struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RecipientID uuid.UUID `gorm:"type:uuid" json:"recipient_id"`
	Title       string    `json:"title"`
	Message     string    `json:"message"`
	Type        string    `json:"type"` // ALERT, INFO, WARNING
	IsRead      bool      `gorm:"default:false" json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

// BroadcastViolationAlert sends notifications to ALL officials + the plot owner
func BroadcastViolationAlert(plotID string, violationType string) {
	// 1. Get plot owner
	var ownerID string
	db.DB.Raw("SELECT owner_id FROM plots WHERE id = ?", plotID).Scan(&ownerID)

	// 2. Get ALL officials (SUPER_ADMIN, ADMIN, INSPECTOR)
	var officialIDs []string
	db.DB.Raw("SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'INSPECTOR')").Scan(&officialIDs)

	// 3. Add owner to notification list
	allRecipients := append(officialIDs, ownerID)

	// 4. Create notifications for all
	for _, recipientID := range allRecipients {
		uid, err := uuid.Parse(recipientID)
		if err != nil {
			continue
		}
		notification := Notification{
			RecipientID: uid,
			Title:       "Violation Detected on Plot " + plotID,
			Message:     "A " + violationType + " violation has been detected on plot " + plotID + ". Immediate action required.",
			Type:        "ALERT",
		}
		db.DB.Create(&notification)
	}

	log.Printf("[NOTIFICATION] Broadcasted %s violation alert for plot %s to %d recipients",
		violationType, plotID, len(allRecipients))

	// TODO: Send actual emails via SMTP/SendGrid
	// for _, id := range allRecipients {
	//     email := getUserEmail(id)
	//     sendEmail(email, notification.Title, notification.Message)
	// }
}

// Handler for notification API
type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) GetMyNotifications(c *gin.Context) {
	userID := c.GetString("user_id") // Set by JWT middleware
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var notifications []Notification
	if err := db.DB.Where("recipient_id = ?", userID).Order("created_at desc").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func (h *Handler) MarkAsRead(c *gin.Context) {
	id := c.Param("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	if err := db.DB.Model(&Notification{}).Where("id = ?", uid).Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func RegisterRoutes(rg *gin.RouterGroup) {
	handler := NewHandler()

	nGroup := rg.Group("/notifications")
	{
		nGroup.GET("/", handler.GetMyNotifications)
		nGroup.PATCH("/:id/read", handler.MarkAsRead)
	}
}
