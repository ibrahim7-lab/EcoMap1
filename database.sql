CREATE DATABASE IF NOT EXISTS ecomap;
USE ecomap;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_name VARCHAR(255) NULL,
  image_path VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_reports_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- Demo data (clearly labelled). These statements are intended for a fresh database.
INSERT INTO reports (title, description, category, latitude, longitude, location_name, status) VALUES
('[DEMO] Garbage pile near market', 'Large pile of mixed waste on the roadside.', 'Garbage Dumping', 19.2183, 72.9781, 'Market road', 'Approved'),
('[DEMO] Pipe leaking for days', 'Water leaking from a main pipe and flowing onto the road.', 'Water Leakage', 19.2300, 72.9700, 'Station road', 'In Progress'),
('[DEMO] Burning of waste', 'Someone burns plastic waste in an empty plot every evening.', 'Open Waste Burning', 19.2100, 72.9900, 'Near the playground', 'Pending Review'),
('[DEMO] Polluted pond', 'The pond water has turned dark and smells bad.', 'Water Pollution', 19.2400, 72.9600, 'Lake side', 'Resolved');
