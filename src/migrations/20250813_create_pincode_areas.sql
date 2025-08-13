-- Migration: Create pincode_areas table for one-to-many relationship
-- Date: 2025-08-13
-- Description: Implement one-to-many pincode-area relationship

-- Create pincode_areas table
CREATE TABLE IF NOT EXISTS pincode_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode_id UUID NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_pincode_areas_pincode_id 
        FOREIGN KEY (pincode_id) 
        REFERENCES pincodes(id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate areas for same pincode
    CONSTRAINT uk_pincode_areas_pincode_area 
        UNIQUE (pincode_id, area_name),
    
    -- Check constraint for area name length
    CONSTRAINT chk_pincode_areas_area_name_length 
        CHECK (LENGTH(TRIM(area_name)) >= 2 AND LENGTH(TRIM(area_name)) <= 100),
    
    -- Check constraint for display order
    CONSTRAINT chk_pincode_areas_display_order 
        CHECK (display_order >= 1 AND display_order <= 50)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pincode_areas_pincode_id 
    ON pincode_areas(pincode_id);

CREATE INDEX IF NOT EXISTS idx_pincode_areas_area_name 
    ON pincode_areas(area_name);

CREATE INDEX IF NOT EXISTS idx_pincode_areas_pincode_order 
    ON pincode_areas(pincode_id, display_order);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_pincode_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pincode_areas_updated_at
    BEFORE UPDATE ON pincode_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_pincode_areas_updated_at();

-- Migrate existing area data from pincodes table to pincode_areas table
INSERT INTO pincode_areas (pincode_id, area_name, display_order)
SELECT 
    id as pincode_id,
    area as area_name,
    1 as display_order
FROM pincodes
WHERE area IS NOT NULL AND TRIM(area) != ''
ON CONFLICT (pincode_id, area_name) DO NOTHING;

-- Add comment to document the migration
COMMENT ON TABLE pincode_areas IS 'Stores multiple areas/localities for each pincode in a one-to-many relationship';
COMMENT ON COLUMN pincode_areas.pincode_id IS 'Foreign key reference to pincodes table';
COMMENT ON COLUMN pincode_areas.area_name IS 'Name of the area/locality within the pincode';
COMMENT ON COLUMN pincode_areas.display_order IS 'Order for displaying areas (1-50)';
