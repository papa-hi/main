-- Add role column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';
    END IF;
END
$$;

-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    ip_address TEXT
);

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT
);

-- Create page_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration INTEGER,
    referrer TEXT,
    ip_address TEXT,
    user_agent TEXT
);

-- Create feature_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS feature_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feature TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Update an existing user to admin or create an admin user if none exists
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Try to update the first user to admin
        UPDATE users SET role = 'admin' WHERE id = 1;
        
        -- Check if update succeeded
        SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin') INTO admin_exists;
        
        -- If no users were updated, create a new admin user
        IF NOT admin_exists THEN
            INSERT INTO users (username, password, first_name, last_name, email, role, created_at)
            VALUES ('admin', '$2b$10$Lcj1Cq9ldVUwMn0L1hxUIe1Bz4QB/OUrW9l/P/QRqfBu.PVSW2ggq', 'Admin', 'User', 'admin@papahi.com', 'admin', CURRENT_TIMESTAMP);
        END IF;
    END IF;
END
$$;