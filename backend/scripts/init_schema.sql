-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table (Dual Auth support)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, -- For Officials
    phone VARCHAR(20) UNIQUE,  -- For Industry/Public
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'INSPECTOR', 'INDUSTRY_OWNER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed System User (for Admin/Govt Plots)
INSERT INTO users (id, name, email, password_hash, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'System Administrator', 'system@csidc.gov.in', 'system_locked', 'SUPER_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Plots Table (Geospatial)
CREATE TABLE plots (
    id VARCHAR(50) PRIMARY KEY, -- P-101 etc.
    owner_id UUID REFERENCES users(id),
    area_sqm DECIMAL(10,2) NOT NULL,
    location_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'COMPLIANT', -- COMPLIANT, VIOLATION, NOTICE_SENT
    geom GEOMETRY(Polygon, 4326) NOT NULL, -- WGS84 coordinates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Violations Table
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id VARCHAR(50) REFERENCES plots(id),
    type VARCHAR(50) NOT NULL, -- ENCROACHMENT, GREEN_COVER, CONSTRUCTION
    status VARCHAR(50) DEFAULT 'DETECTED', -- DETECTED, VERIFIED, NOTICE_SENT, RESOLVED
    confidence_score DECIMAL(5,2),
    image_before_url TEXT,
    image_after_url TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table (Broadcast)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'ALERT', -- ALERT, INFO, WARNING
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Jobs (Sentinel Scheduler)
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id VARCHAR(50) REFERENCES plots(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    satellite_image_date DATE,
    ndvi_score DECIMAL(5,2),
    processed_at TIMESTAMP WITH TIME ZONE
);
