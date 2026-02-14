package violations

import (
	"backend/pkg/common/db"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	Create(v *Violation) error
	FindAll() ([]Violation, error)
	FindByPlotID(plotID string) ([]Violation, error)
	FindByID(id uuid.UUID) (*Violation, error)
	UpdateStatus(id uuid.UUID, status string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository() Repository {
	return &repository{db: db.DB}
}

func (r *repository) Create(v *Violation) error {
	return r.db.Create(v).Error
}

func (r *repository) FindAll() ([]Violation, error) {
	var violations []Violation
	err := r.db.Preload("Plot").Order("detected_at desc").Find(&violations).Error
	return violations, err
}

func (r *repository) FindByPlotID(plotID string) ([]Violation, error) {
	var violations []Violation
	err := r.db.Preload("Plot").Where("plot_id = ?", plotID).Find(&violations).Error
	return violations, err
}

func (r *repository) FindByID(id uuid.UUID) (*Violation, error) {
	var violation Violation
	if err := r.db.Preload("Plot").First(&violation, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &violation, nil
}

func (r *repository) UpdateStatus(id uuid.UUID, status string) error {
	return r.db.Model(&Violation{}).Where("id = ?", id).Update("status", status).Error
}
