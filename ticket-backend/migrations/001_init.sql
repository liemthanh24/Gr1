-- =============================================
-- Concert Ticket Booking System - Database Schema
-- =============================================

-- Enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- 1. Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    phone VARCHAR(20),
    cccd VARCHAR(20),
    dob DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    venue VARCHAR(255),
    image_url TEXT,
    total_tickets INT NOT NULL,
    available_tickets INT NOT NULL,
    price DECIMAL(12, 0) DEFAULT 0,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tickets table (seat inventory)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    seat_code VARCHAR(50) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, seat_code)
);

-- 4. Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    event_id INT REFERENCES events(id),
    ticket_id INT REFERENCES tickets(id),
    seat_code VARCHAR(50),
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_event_seat ON tickets(event_id, seat_code);

-- =============================================
-- Seed Data
-- =============================================

INSERT INTO users (name, email, password_hash, role, phone, cccd, dob, address) VALUES
('Admin Liem', 'admin@gmail.com', '$2a$10$GEcRBHeKzaY9903bA5AUse5jKwYt8YzGUHkAqOSK1SGS8zhzNqjLO', 'admin', '0123456789', '012345678912', '1990-01-01', 'Hanoi');

INSERT INTO events (name, description, venue, image_url, total_tickets, available_tickets, price, event_date) VALUES
('Sơn Tùng M-TP - Sky Tour 2026', 'Đêm nhạc hoành tráng nhất năm với hàng loạt bản hit đình đám. Sân khấu công nghệ LED 360 độ.', 'Sân vận động Mỹ Đình, Hà Nội', '/images/sontung.jpg', 100, 100, 1500000, '2026-07-15 19:30:00'),
('BLACKPINK World Tour - Hà Nội', 'BLACKPINK lần đầu biểu diễn tại Việt Nam trong khuôn khổ Born Pink World Tour. Không thể bỏ lỡ!', 'Trung tâm Hội nghị Quốc gia, Hà Nội', '/images/blackpink.jpg', 200, 200, 2500000, '2026-08-20 20:00:00'),
('Đen Vâu - Acoustic Night', 'Một đêm nhạc acoustic ấm cúng cùng Đen Vâu. Không gian nhỏ, cảm xúc lớn.', 'Nhà hát Lớn Hà Nội', '/images/denvau.jpg', 50, 50, 800000, '2026-09-10 19:00:00');

-- Generate 100 tickets for Event 1 (A1-J10)
INSERT INTO tickets (event_id, seat_code)
SELECT 1, chr(64 + ((s-1)/10) + 1) || ((s-1) % 10 + 1)::text
FROM generate_series(1, 100) s;

-- Generate 200 tickets for Event 2 (A1-T10)
INSERT INTO tickets (event_id, seat_code)
SELECT 2, chr(64 + ((s-1)/10) + 1) || ((s-1) % 10 + 1)::text
FROM generate_series(1, 200) s;

-- Generate 50 tickets for Event 3 (A1-E10)
INSERT INTO tickets (event_id, seat_code)
SELECT 3, chr(64 + ((s-1)/10) + 1) || ((s-1) % 10 + 1)::text
FROM generate_series(1, 50) s;
