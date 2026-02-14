package allotments

import (
	"backend/pkg/common/db"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	Create(app *Allotment) error
	GetByID(id uuid.UUID) (*Allotment, error)
	GetByOwner(ownerID uuid.UUID) ([]Allotment, error)
	GetAll() ([]Allotment, error)
	Update(app *Allotment) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository() Repository {
	return &repository{db: db.DB}
}

func (r *repository) Create(app *Allotment) error {
	return r.db.Create(app).Error
}

func (r *repository) GetByID(id uuid.UUID) (*Allotment, error) {
	var app Allotment
	if err := r.db.First(&app, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *repository) GetByOwner(ownerID uuid.UUID) ([]Allotment, error) {
	var apps []Allotment
	if err := r.db.Find(&apps, "owner_id = ?", ownerID).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *repository) GetAll() ([]Allotment, error) {
	var apps []Allotment
	if err := r.db.Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *repository) Update(app *Allotment) error {
	return r.db.Save(app).Error
}
