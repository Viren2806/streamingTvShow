// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const app = express();

// ✅ Use Render-provided PORT, fallback for local dev
const port = process.env.PORT || 4000;

// ✅ Middleware
app.use(express.json());
app.use(cors());

// Disable all caching for API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ✅ Database Connection Pool (Render PostgreSQL)
const pool = new Pool({
  user: 'tvtable_user',
  host: 'dpg-d4055u6uk2gs739pk740-a.oregon-postgres.render.com',
  database: 'tvtable',
  password: 'rHDBz8kp7e4wqeH7Yl9KjwPMGQtofA1e',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// --- POST: Save Movie ---
app.post('/savemovies', async (req, res) => {
  const { title, director, budget, location, duration, year } = req.body;

  if (!title || !director || !year) {
    return res.status(400).json({ error: 'Missing required fields: title, director, and year are mandatory.' });
  }

  const queryText = `
    INSERT INTO ott (title, director, budget, location, duration, year)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  try {
    const result = await pool.query(queryText, [title, director, budget, location, duration, year]);
    res.status(201).json({ message: '✅ Data saved successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('❌ Database INSERT error:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});
// --- GET: All Movies with Pagination ---
app.get("/getallmovies", async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // default page=1, limit=10
  const offset = (page - 1) * limit;

  try {
    const total = await pool.query("SELECT COUNT(*) FROM ott;");
    const result = await pool.query(
      "SELECT * FROM ott ORDER BY id ASC LIMIT $1 OFFSET $2;",
      [limit, offset]
    );

    res.status(200).json({
      message: "✅ All records fetched!",
      total: parseInt(total.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      data: result.rows,
    });
  } catch (error) {
    console.error("Database SELECT error:", error);
    res.status(500).json({
      error: "Failed to fetch data",
      details: error.message,
    });
  }
});

// --- GET: Search Movies with Pagination ---
app.get("/searchmovies", async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    const total = await pool.query(
      "SELECT COUNT(*) FROM ott WHERE LOWER(title) LIKE LOWER($1);",
      [`%${q}%`]
    );

    const result = await pool.query(
      "SELECT * FROM ott WHERE LOWER(title) LIKE LOWER($1) ORDER BY id ASC LIMIT $2 OFFSET $3;",
      [`%${q}%`, limit, offset]
    );

    res.status(200).json({
      message: "✅ Movies found!",
      total: parseInt(total.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      data: result.rows,
    });
  } catch (error) {
    console.error(" Database SEARCH error:", error);
    res.status(500).json({
      error: "Failed to search movies.",
      details: error.message,
    });
  }
});

// --- PUT: Update Movie ---
app.put('/updatemovie/:id', async (req, res) => {
  const { id } = req.params;
  const { title, director, budget, location, duration, year } = req.body;

  try {
    const result = await pool.query(
      `UPDATE ott
       SET title=$1, director=$2, budget=$3, location=$4, duration=$5, year=$6
       WHERE id=$7 RETURNING *;`,
      [title, director, budget, location, duration, year, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'No record found with this ID.' });
    res.status(200).json({ message: '✅ Updated successfully!', data: result.rows[0] });
  } catch (error) {
    console.error(' Database UPDATE error:', error);
    res.status(500).json({ error: 'Failed to update data', details: error.message });
  }
});

// --- DELETE: Delete Movie ---
app.delete('/deletemovie/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM ott WHERE id=$1 RETURNING *;', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'No record found with this ID.' });
    res.status(200).json({ message: '🗑️ Deleted successfully!', deleted: result.rows[0] });
  } catch (error) {
    console.error('❌ Database DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete record', details: error.message });
  }
});

// ✅ Serve React frontend (after build)
app.use(express.static(path.join(__dirname, "build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
