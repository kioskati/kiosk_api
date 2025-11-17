const express = require("express");
const cors = require("cors");
const multer = require("multer");
// const csv = require("csv-parser");
// const fs = require("fs");
const db = require("./db");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;
const path = require("path");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// RESTful Routes

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ########### LOGIN ####################

//
// 🔹 Register
//

app.post("/api/register", async (req, res) => {
  const { fullName, userName, password } = req.body.data;

  if (!fullName || !userName || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (fullName, userName, password) VALUES (?, ?, ?)`,
      [fullName, userName, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Username already exists" });
          }
          return res
            .status(500)
            .json({ error: "Database error: " + err.message });
        }
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

//
// 🔹 Login
//
app.post("/api/login", (req, res) => {
  const { userName, password } = req.body.data;

  if (!userName || !password)
    return res.status(400).json({ error: "Username and password required" });

  db.get(`SELECT * FROM users WHERE userName = ?`, [userName], (err, user) => {
    if (err)
      return res.status(500).json({ error: "Database error: " + err.message });

    if (!user) return res.status(404).json({ error: "User not found" });

    bcrypt.compare(password, user.password, (err, match) => {
      if (err)
        return res.status(500).json({ error: "Error verifying password" });

      if (!match) return res.status(401).json({ error: "Invalid password" });

      res.json({ message: "Login successful", username: user.username });
    });
  });
});

//
// 🔹 List User
//
app.get("/api/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//
// 🔹 Delete User
//
app.delete("/api/users/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  });
});

// ########### SERVICES ####################

// GET all services
app.get("/api/services", (req, res) => {
  db.all("SELECT * FROM digitalServices", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single services by id
app.get("/api/services/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM digitalServices WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(row);
  });
});

// POST insert services
app.post("/api/services", express.json(), (req, res) => {
  const jsonData = req.body.data;

  if (!Array.isArray(jsonData)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const insertStmt = db.prepare(
    "INSERT INTO digitalServices (name, displayName, imagePath, url) VALUES (?, ?, ?, ?)"
  );

  let insertedCount = 0;
  let duplicateCount = 0;

  db.serialize(() => {
    let processed = 0;

    jsonData.forEach((row, index) => {
      insertStmt.run(
        [row.name, row.displayName, row.imagePath, row.url],
        (err) => {
          processed++;

          if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
              //   console.warn(`Duplicate found, skipping url: ${row.url}`);
              duplicateCount++;
            } else {
              //   console.error("Unexpected insert error:", err);
            }
          } else {
            insertedCount++;
          }

          if (processed === jsonData.length) {
            insertStmt.finalize((finalizeErr) => {
              if (finalizeErr) {
                return res
                  .status(500)
                  .json({ error: "Database finalize failed" });
              }

              return res.json({
                message: "Upload complete",
                inserted: insertedCount,
                duplicates: duplicateCount,
              });
            });
          }
        }
      );
    });

    if (jsonData.length === 0) {
      insertStmt.finalize(() => {
        return res.json({
          message: "No data received",
          inserted: 0,
          duplicates: 0,
        });
      });
    }
  });
});

// PUT update services
app.put("/api/services/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  db.run(
    "UPDATE digitalServices SET name = ? WHERE id = ?",
    [name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({ id, name });
    }
  );
});

// DELETE services
app.delete("/api/services/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM digitalServices WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted" });
  });
});

// ########### CATEGORIES ####################

// GET all categories
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single category by id
app.get("/api/categories/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM categories WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(row);
  });
});

// POST insert category
app.post("/api/categories", express.json(), (req, res) => {
  const jsonData = req.body.data;

  if (!Array.isArray(jsonData)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const insertStmt = db.prepare("INSERT INTO categories (name) VALUES (?)");

  let insertedCount = 0;
  let duplicateCount = 0;

  db.serialize(() => {
    let processed = 0;

    jsonData.forEach((row, index) => {
      insertStmt.run([row.name], (err) => {
        processed++;

        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            //   console.warn(`Duplicate found, skipping url: ${row.url}`);
            duplicateCount++;
          } else {
            //   console.error("Unexpected insert error:", err);
          }
        } else {
          insertedCount++;
        }

        if (processed === jsonData.length) {
          insertStmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              return res
                .status(500)
                .json({ error: "Database finalize failed" });
            }

            return res.json({
              message: "Upload complete",
              inserted: insertedCount,
              duplicates: duplicateCount,
            });
          });
        }
      });
    });

    if (jsonData.length === 0) {
      insertStmt.finalize(() => {
        return res.json({
          message: "No data received",
          inserted: 0,
          duplicates: 0,
        });
      });
    }
  });
});

// PUT update category
app.put("/api/categories/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  db.run(
    "UPDATE categories SET name = ? WHERE id = ?",
    [name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ id, name });
    }
  );
});

// DELETE category
app.delete("/api/categories/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  });
});

// ########### LANGUAGES ####################

// GET all languages
app.get("/api/languages", (req, res) => {
  db.all("SELECT * FROM languages", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single language by id
app.get("/api/languages/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM languages WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.json(row);
  });
});

// POST insert language
app.post("/api/languages", express.json(), (req, res) => {
  const jsonData = req.body.data;

  if (!Array.isArray(jsonData)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const insertStmt = db.prepare("INSERT INTO languages (name) VALUES (?)");

  let insertedCount = 0;
  let duplicateCount = 0;

  db.serialize(() => {
    let processed = 0;

    jsonData.forEach((row, index) => {
      insertStmt.run([row.name], (err) => {
        processed++;

        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            //   console.warn(`Duplicate found, skipping url: ${row.url}`);
            duplicateCount++;
          } else {
            //   console.error("Unexpected insert error:", err);
          }
        } else {
          insertedCount++;
        }

        if (processed === jsonData.length) {
          insertStmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              return res
                .status(500)
                .json({ error: "Database finalize failed" });
            }

            return res.json({
              message: "Upload complete",
              inserted: insertedCount,
              duplicates: duplicateCount,
            });
          });
        }
      });
    });

    if (jsonData.length === 0) {
      insertStmt.finalize(() => {
        return res.json({
          message: "No data received",
          inserted: 0,
          duplicates: 0,
        });
      });
    }
  });
});

// PUT update language
app.put("/api/languages/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  db.run(
    "UPDATE languages SET name = ? WHERE id = ?",
    [name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json({ id, name });
    }
  );
});

// DELETE language
app.delete("/api/languages/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM languages WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.json({ message: "Language deleted" });
  });
});

// ########### SUBJECT AREAS ####################

// GET all subject areas
app.get("/api/subjectAreas", (req, res) => {
  db.all("SELECT * FROM subjectAreas", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single subject area by id
app.get("/api/subjectAreas/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM subjectAreas WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Subject Area not found" });
    }
    res.json(row);
  });
});

// POST insert subject area
app.post("/api/subjectAreas", express.json(), (req, res) => {
  const jsonData = req.body.data;

  if (!Array.isArray(jsonData)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const insertStmt = db.prepare("INSERT INTO subjectAreas (name) VALUES (?)");

  let insertedCount = 0;
  let duplicateCount = 0;

  db.serialize(() => {
    let processed = 0;

    jsonData.forEach((row, index) => {
      insertStmt.run([row.name], (err) => {
        processed++;

        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            //   console.warn(`Duplicate found, skipping url: ${row.url}`);
            duplicateCount++;
          } else {
            //   console.error("Unexpected insert error:", err);
          }
        } else {
          insertedCount++;
        }

        if (processed === jsonData.length) {
          insertStmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              return res
                .status(500)
                .json({ error: "Database finalize failed" });
            }

            return res.json({
              message: "Upload complete",
              inserted: insertedCount,
              duplicates: duplicateCount,
            });
          });
        }
      });
    });

    if (jsonData.length === 0) {
      insertStmt.finalize(() => {
        return res.json({
          message: "No data received",
          inserted: 0,
          duplicates: 0,
        });
      });
    }
  });
});

// PUT update subject area
app.put("/api/subjectAreas/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  db.run(
    "UPDATE subjectAreas SET name = ? WHERE id = ?",
    [name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Subject Area not found" });
      }
      res.json({ id, name });
    }
  );
});

// DELETE subject area
app.delete("/api/subjectAreas/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM subjectAreas WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Subject Area not found" });
    }
    res.json({ message: "Subject Area deleted" });
  });
});

// ########### CONTENTS ####################

// GET all contents

// app.get("/api/contents", (req, res) => {
//   const sql = `
//     SELECT
//       dc.*,
//       c.name AS category,
//       l.name AS language,
//       s.name AS subjectArea
//     FROM
//       digitalContents dc
//     LEFT JOIN
//       categories c ON dc.categoryId = c.id
//       LEFT JOIN
//       languages l ON dc.languageId = l.id
//       LEFT JOIN
//       subjectAreas s ON dc.subjectAreaId = s.id
//   `;

//   db.all(sql, [], (err, rows) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     const duplicated = [];
//     for (let i = 0; i < 10; i++) {
//       duplicated.push(...rows);
//     }
//     res.json(duplicated);
//   });
// });
app.get("/api/contents", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sql = `
    SELECT 
      dc.*, 
      c.name AS category,
      l.name AS language,
      s.name AS subjectArea
    FROM 
      digitalContents dc
    LEFT JOIN 
      categories c ON dc.categoryId = c.id
      LEFT JOIN 
      languages l ON dc.languageId = l.id
      LEFT JOIN 
      subjectAreas s ON dc.subjectAreaId = s.id
    ORDER BY
      CASE
        WHEN dc.languageId = 1 THEN 1
        ELSE 2
      END
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit - 1;
    const duplicated = [];
    for (let i = 0; i < 10; i++) {
      duplicated.push(...rows);
    }

    const paginatedItems = rows.slice(startIndex, endIndex);
    const response = {
      page,
      limit,
      totalCount: rows.length,
      totalPages: Math.ceil(rows.length / limit),
      data: paginatedItems,
    };

    res.json(response);
  });
});

// GET /videos?page=1&limit=10
app.get("/api/contents", (req, res) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1; // default page 1
  limit = parseInt(limit) || 10; // default limit 10

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Slice the data
  const paginatedItems = items.slice(startIndex, endIndex);

  // Prepare response
  const response = {
    page,
    limit,
    totalCount: items.length,
    totalPages: Math.ceil(items.length / limit),
    data: paginatedItems,
  };

  res.json(response);
});

// GET filter contents by languageId, categoryId, and subjectAreaId
// :languageId/:categoryId/:subjectAreaId
app.get("/api/contents/filter", (req, res) => {
  const { languageId, categoryId, subjectAreaId } = req.query;

  let conditions = [];
  let params = [];

  if (languageId) {
    conditions.push("dc.languageId = ?");
    params.push(languageId);
  }
  if (categoryId) {
    conditions.push("dc.categoryId = ?");
    params.push(categoryId);
  }
  if (subjectAreaId) {
    conditions.push("dc.subjectAreaId = ?");
    params.push(subjectAreaId);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const sql = `
    SELECT 
      dc.*, 
      c.name AS category,
      l.name AS language,
      sa.name AS subjectArea
    FROM 
      digitalContents dc
    LEFT JOIN 
      categories c ON dc.categoryId = c.id
    LEFT JOIN 
      languages l ON dc.languageId = l.id
    LEFT JOIN 
      subjectAreas sa ON dc.subjectAreaId = sa.id
    ${whereClause}
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET single contents by id
app.get("/api/contents/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM digitalContents WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Content not found" });
    }
    res.json(row);
  });
});

// POST insert contents
app.post("/api/contents", express.json(), (req, res) => {
  const jsonData = req.body.data;

  if (!Array.isArray(jsonData)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  const insertStmt = db.prepare(
    "INSERT INTO digitalContents (categoryId, languageId, subjectAreaId, videoTitle, videoPath, thumbNailPath, youtubeId) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  let insertedCount = 0;
  let duplicateCount = 0;

  db.serialize(() => {
    let processed = 0;

    jsonData.forEach((row, index) => {
      insertStmt.run(
        [
          row.categoryId,
          row.languageId,
          row.subjectAreaId,
          row.videoTitle,
          row.videoPath,
          row.thumbNailPath,
          row.youtubeId,
        ],
        (err) => {
          processed++;

          if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
              //   console.warn(`Duplicate found, skipping url: ${row.url}`);
              duplicateCount++;
            } else {
              //   console.error("Unexpected insert error:", err);
            }
          } else {
            insertedCount++;
          }

          if (processed === jsonData.length) {
            insertStmt.finalize((finalizeErr) => {
              if (finalizeErr) {
                return res
                  .status(500)
                  .json({ error: "Database finalize failed" });
              }

              return res.json({
                message: "Upload complete",
                inserted: insertedCount,
                duplicates: duplicateCount,
              });
            });
          }
        }
      );
    });

    if (jsonData.length === 0) {
      insertStmt.finalize(() => {
        return res.json({
          message: "No data received",
          inserted: 0,
          duplicates: 0,
        });
      });
    }
  });
});

// PUT update contents
app.put("/api/contents/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  db.run(
    "UPDATE digitalContents SET name = ? WHERE id = ?",
    [name, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json({ id, name });
    }
  );
});

// DELETE contents
app.delete("/api/contents/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM digitalContents WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Content not found" });
    }
    res.json({ message: "Content deleted" });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
