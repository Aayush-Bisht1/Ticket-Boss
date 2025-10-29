CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE,
    name VARCHAR(100),
    total_seats INT,
    available_seats INT,
    version INT DEFAULT 0
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    reservation_id UUID DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) REFERENCES events(event_id),
    user_id INT REFERENCES users(id),
    partner_id VARCHAR(100),
    seats INT,
    status VARCHAR(20) DEFAULT 'confirmed'
);