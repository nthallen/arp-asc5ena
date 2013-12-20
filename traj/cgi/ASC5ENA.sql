-- CREATE USER 'asc5ena'@'localhost' IDENTIFIED BY '5zzy$3kN3qBV7W';
-- GRANT ALL ON ASC5ENA.* TO 'asc5ena'@'localhost';
-- CREATE DATABASE IF NOT EXISTS ASC5ENA;

DROP TABLE IF EXISTS Session;
CREATE TABLE Session (
  Session_Key CHAR(30) NOT NULL PRIMARY KEY,
  UserID INT NOT NULL,
  LastUsed TIMESTAMP
);

-- Email Needs to be unique in order to facilitate password reset
DROP TABLE IF EXISTS User;
CREATE Table User (
  UserID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(30) NOT NULL UNIQUE KEY,
  Password CHAR(32) NOT NULL,
  FullName VARCHAR(60) NOT NULL,
  Email VARCHAR(80) NOT NULL UNIQUE KEY,
  Confirmed BOOLEAN DEFAULT 0
);

INSERT INTO User (Username, Password, FullName, Email)
VALUES ('Guest', MD5('Guest'), 'Guest', '');

DROP TABLE IF EXISTS Flight;
CREATE Table Flight (
  FlightID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  StartDate DATETIME NOT NULL,
  Model VARCHAR(30) NOT NULL,
  Level INT NOT NULL,
  Comments TEXT NOT NULL
);

DROP TABLE IF EXISTS Trajectory;
CREATE Table Trajectory (
  TrajID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  FlightID INT NOT NULL,
  armtime DECIMAL(10,3) NOT NULL,
  Latitude DECIMAL(6,4) NOT NULL,
  Longitude DECIMAL(7,4) NOT NULL,
  Thrust DECIMAL(4,3) NOT NULL,
  Orientation DECIMAL(7,4) NOT NULL
);

-- Confirmation Table, used for both new users and password reset
-- For new users:
--   UserID = 0
--   FullName = FullName
-- For password reset
--   UserID = UserID
-- In both cases, save/copy Email
DROP TABLE IF EXISTS Confirmation;
CREATE Table Confirmation (
  ConfID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ConfKey CHAR(20) NOT NULL UNIQUE KEY,
  ConfTime TIMESTAMP,
  UserID INT NOT NULL
);
