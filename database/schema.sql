-- =================================================================
-- UJ Campus Finder — Database Schema
-- -----------------------------------------------------------------
-- Safe to run from phpMyAdmin or MySQL Workbench.
-- Creates the database and the three tables used by the project:
--   1) reports          → lost / found item reports
--   2) claim_requests   → claims linked to a report
--   3) contact_messages → messages from the contact page
-- =================================================================

CREATE DATABASE IF NOT EXISTS uj_campus_finder
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE uj_campus_finder;

-- -----------------------------------------------------------------
-- Table: reports
-- Stores lost and found item reports submitted by students.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    type        ENUM('lost', 'found')        NOT NULL,
    title       VARCHAR(150)                 NOT NULL,
    description TEXT,
    location    VARCHAR(200),
    image_path  VARCHAR(300) DEFAULT NULL,   -- optional uploaded image
    contact     VARCHAR(150),
    status      ENUM('open', 'resolved')     NOT NULL DEFAULT 'open',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------
-- Table: claim_requests
-- Stores requests from students claiming a found / lost item.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claim_requests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    report_id   INT          NOT NULL,
    claimant    VARCHAR(100) NOT NULL,
    message     TEXT,
    status      ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Table: contact_messages
-- Stores messages submitted from the contact page.
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    subject    VARCHAR(200),
    message    TEXT         NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
