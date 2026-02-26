-- Migration: Add Dad Days Calendar Availability Tables
-- Description: Adds user_availability and availability_matches tables for calendar-based matching

-- User Availability Table
CREATE TABLE IF NOT EXISTS user_availability (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    
    -- Time slot
    time_slot VARCHAR(20) NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'allday')),
    
    -- Optional: More granular time ranges (for future)
    start_time VARCHAR(5),  -- "09:00"
    end_time VARCHAR(5),    -- "12:00"
    
    -- Recurrence pattern
    recurrence_type VARCHAR(20) DEFAULT 'weekly' CHECK (recurrence_type IN ('weekly', 'biweekly')),
    
    -- Active/inactive
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Optional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Indexes for performance
    CONSTRAINT unique_user_slot UNIQUE (user_id, day_of_week, time_slot, recurrence_type)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_availability_day_slot ON user_availability(day_of_week, time_slot, is_active);
CREATE INDEX IF NOT EXISTS idx_user_availability_user ON user_availability(user_id, is_active);

-- Availability Matches Table (Cached)
CREATE TABLE IF NOT EXISTS availability_matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Shared availability slots (JSON array)
    shared_slots JSONB NOT NULL,
    
    -- Match quality score (0-100)
    match_score INTEGER DEFAULT 0,
    
    -- Distance between users
    distance_km DECIMAL(5,2),
    
    -- Last calculated
    calculated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_availability_match UNIQUE (user_id, matched_user_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_availability_matches_user_score ON availability_matches(user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_availability_matches_calculated ON availability_matches(calculated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_availability_updated_at BEFORE UPDATE ON user_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_matches_updated_at BEFORE UPDATE ON availability_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_availability IS 'Stores users recurring weekly availability for playdates';
COMMENT ON TABLE availability_matches IS 'Cached matches based on shared availability slots';
COMMENT ON COLUMN user_availability.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN user_availability.time_slot IS 'morning (7am-12pm), afternoon (12pm-5pm), evening (5pm-8pm), allday (flexible)';
