const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../database_storage/database.db");

// Initialize the table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS digitalServices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        displayName TEXT NULL,
        imagePath TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE
    )`);

  db.run("PRAGMA foreign_keys = ON");

  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL UNIQUE,
      userName TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE)`);

  db.run(`CREATE TABLE IF NOT EXISTS languages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE)`);

  db.run(`CREATE TABLE IF NOT EXISTS subjectAreas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE)`);

  db.run(`CREATE TABLE IF NOT EXISTS digitalContents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoryId INTEGER NOT NULL,
        languageId INTEGER NOT NULL,
        subjectAreaId INTEGER NOT NULL,
        videoTitle TEXT NOT NULL UNIQUE,
        videoPath TEXT NOT NULL,
        thumbNailPath TEXT NOT NULL,
        youtubeId TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE SET NULL,
        FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE SET NULL ON UPDATE SET NULL,
        FOREIGN KEY (subjectAreaId) REFERENCES subjectAreas(id) ON DELETE SET NULL ON UPDATE SET NULL
    )`);
});

module.exports = db;
