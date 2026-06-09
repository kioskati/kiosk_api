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

  db.run(`CREATE TABLE IF NOT EXISTS gsmaContents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titleAmharic TEXT NOT NULL UNIQUE,
        titleEnglish TEXT NOT NULL UNIQUE,
        languageId INTEGER NOT NULL,
        type TEXT NOT NULL,
        thumbNailPath TEXT NOT NULL,
        filePath TEXT NOT NULL,
        FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE SET NULL ON UPDATE SET NULL
    )`);

  //   db.run(`DROP TABLE _8028AudioContent`);
  //   db.run(`DROP TABLE _8028SoilTypeMenu`);
  //   db.run(`DROP TABLE _8028AltitudeMenu`);
  //   db.run(`DROP TABLE _8028LivestockMenu`);
  //   db.run(`DROP TABLE _8028CropMenu`);
  //   db.run(`DROP TABLE _8028SubMenu`);
  //   db.run(`DROP TABLE _8028MainMenu`);
  //   db.run(`DROP TABLE _8028TopMenu`);
  //   db.run(`DROP TABLE _8028Languages`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028Languages (
        code INTEGER PRIMARY KEY NOT NULL UNIQUE,
        code8028 INTEGER NOT NULL,
        name TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL UNIQUE,
        languageTranslation TEXT NULL,
        topMenuTranslation TEXT NULL,
        mainMenuTranslation TEXT NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028TopMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        code8028 INTEGER NOT NULL,
        languageCode INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        FOREIGN KEY (languageCode) REFERENCES _8028Languages(code) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028MainMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        topMenuId INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        nextMenu TEXT NOT NULL,
        FOREIGN KEY (topMenuId) REFERENCES _8028TopMenu(id) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028SubMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        mainMenuId INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        nextMenu TEXT NOT NULL,
        FOREIGN KEY (mainMenuId) REFERENCES _8028MainMenu(id) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028LivestockMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        subMenuId INTEGER NOT NULL,
        typeOfMenu INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        nextMenu TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028CropMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        code8028 INTEGER NOT NULL,
        languageCode INTEGER NOT NULL,
        typeOfCrop INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        FOREIGN KEY (languageCode) REFERENCES _8028Languages(code) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028AltitudeMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        languageCode INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        FOREIGN KEY (languageCode) REFERENCES _8028Languages(code) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028SoilTypeMenu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code INTEGER NOT NULL,
        languageCode INTEGER NOT NULL,
        name TEXT NOT NULL,
        displayName TEXT NOT NULL,
        FOREIGN KEY (languageCode) REFERENCES _8028Languages(code) ON DELETE SET NULL ON UPDATE SET NULL)`);

  db.run(`CREATE TABLE IF NOT EXISTS _8028AudioContent (
        id INTEGER PRIMARY KEY,
        languageCode INTEGER NOT NULL,
        topMainMenu INTEGER NOT NULL,
        mainMenuOption INTEGER NOT NULL,
        secondMenuOption INTEGER NOT NULL,
        livestockMenuOption INTEGER NOT NULL,
        altitudeMenuOption INTEGER NOT NULL,
        soilTypeMenuOption INTEGER NOT NULL,
        cropMenuOption INTEGER NOT NULL,
        contentFile TEXT NOT NULL,
        contentPlayedLog TEXT NOT NULL)`);
});

module.exports = db;
