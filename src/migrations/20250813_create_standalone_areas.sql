-- Migration: Create standalone areas table
-- Date: 2025-08-13
-- Description: Create a separate table for standalone areas that can be reused across pincodes

-- Create standalone areas table
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Check constraint for area name length
    CONSTRAINT chk_areas_name_length 
        CHECK (LENGTH(TRIM(name)) >= 2 AND LENGTH(TRIM(name)) <= 100)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_areas_updated_at();

-- Add comment to document the table
COMMENT ON TABLE areas IS 'Stores standalone areas that can be reused across multiple pincodes';
COMMENT ON COLUMN areas.name IS 'Unique name of the area/locality';
