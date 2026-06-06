-- ============================================
-- Thermal Plant Monitoring Platform
-- Database Schema + Seed Data
-- ============================================

CREATE DATABASE IF NOT EXISTS thermal_plant;
USE thermal_plant;

-- -------- USERS TABLE --------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('engineer', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------- PLANTS TABLE --------
CREATE TABLE IF NOT EXISTS plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    nameplate_capacity DECIMAL(10, 2) DEFAULT 0.00,
    total_units INT NOT NULL DEFAULT 0,
    faulty_units INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------- UNITS TABLE --------
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    unit_number INT NOT NULL,
    status ENUM('normal', 'faulty') NOT NULL DEFAULT 'normal',
    fault_type VARCHAR(100) DEFAULT NULL,
    confidence_score DECIMAL(5, 2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plant_unit (plant_id, unit_number)
);

-- -------- REQUESTS TABLE --------
CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    unit_id INT NOT NULL,
    engineer_id INT NOT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL,
    fault_type VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    telemetry_data JSON DEFAULT NULL,
    status ENUM('open', 'resolved', 'dropped') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (engineer_id) REFERENCES users(id) ON DELETE CASCADE
);
