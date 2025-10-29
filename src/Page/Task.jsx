import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 🎨 Common Styles
const inputStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  width: "100%",
  boxSizing: "border-box",
};

const tableHeaderStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tableCellStyle = {
  padding: "10px",
  border: "1px solid #eee",
  textAlign: "left",
  fontSize: "14px",
};

// 🎬 Entry Form (Add/Edit)
function EntryForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    director: "",
    budget: "",
    location: "",
    duration: "",
    year: "",
    notes: "",
    ...initial,
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, ...initial }));
  }, [initial]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required!");
    onSave(form);
  };

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "10px",
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "12px",
        background: "#fdfdfd",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "20px",
      }}
    >
      <input
        placeholder="🎥 Title"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
        style={inputStyle}
        required
      />
      <input
        placeholder="🎬 Director"
        value={form.director}
        onChange={(e) => update("director", e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="💰 Budget"
        value={form.budget}
        onChange={(e) => update("budget", e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="📍 Location"
        value={form.location}
        onChange={(e) => update("location", e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="⏱ Duration"
        value={form.duration}
        onChange={(e) => update("duration", e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="📅 Year / Time"
        value={form.year}
        onChange={(e) => update("year", e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="📝 Notes"
        value={form.notes}
        onChange={(e) => update("notes", e.target.value)}
        style={{ ...inputStyle, minHeight: "80px" }}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="submit"
          style={{
            flex: 1,
            background: "#28a745",
            color: "#fff",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          💾 Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            background: "#6c757d",
            color: "#fff",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          ❌ Cancel
        </button>
      </div>
    </motion.form>
  );
}

// 🎞 Main Component
function Task() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // ✅ Fetch all movies
  const fetchOTTData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/getallmovies");
      const json = await response.json();

      if (response.ok) {
        setEntries(json.data || []);
      } else {
        console.error("API Error:", json.error || json.message);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load data initially
  useEffect(() => {
    fetchOTTData();
  }, []);

  // 🔹 Live Search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (search.trim() === "") {
        fetchOTTData();
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:4000/searchmovies?q=${encodeURIComponent(search)}`
        );
        const json = await res.json();
        if (res.ok) {
          setEntries(json.data || []);
        } else {
          console.error("Search error:", json.error || json.message);
        }
      } catch (err) {
        console.error("Search request failed:", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // 🔹 Create Entry
  const handleCreate = async (data) => {
    try {
      const res = await fetch("http://localhost:4000/savemovies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        alert(json.message || "✅ Movie saved successfully!");
        setEntries((prev) => [json.data, ...prev]);
        setShowForm(false);
      } else {
        alert("❌ Failed to save: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("⚠️ Network error while saving data.");
    }
  };

  // 🔹 Update Entry
  const handleUpdate = async (id, data) => {
    try {
      const res = await fetch(`http://localhost:4000/updatemovie/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        alert("✅ Movie updated successfully!");
        setEntries((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...json.data } : m))
        );
        setEditing(null);
      } else {
        alert("❌ Failed to update: " + (json.error || json.message));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("⚠️ Network error while updating data.");
    }
  };

  // 🔹 Delete Entry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`http://localhost:4000/deletemovie/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        alert("🗑️ Movie deleted successfully!");
        setEntries((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert("❌ Failed to delete: " + (json.error || json.message));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("⚠️ Network error while deleting data.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ maxWidth: "1000px", margin: "auto", padding: "20px" }}
    >
      <motion.h1 layout style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px" }}>
        🎬 OTT Database Records
      </motion.h1>

      {/* Add / Hide Form Button */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditing(null);
        }}
        style={{
          padding: "10px 20px",
          marginTop: "15px",
          borderRadius: "8px",
          border: "none",
          background: showForm ? "#dc3545" : "#007bff",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {showForm ? "Hide Form" : "➕ Add New Movies"}
      </button>

      {/* 🔍 Search Box */}
      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="🔍 Search movies"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <EntryForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#6c757d" }}>Loading...</p>
      ) : entries.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6c757d" }}>
          No data found in database.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
            }}
          >
            <thead>
              <tr style={{ background: "#e9ecef" }}>
                <th style={tableHeaderStyle}>Title</th>
                <th style={tableHeaderStyle}>Director</th>
                <th style={tableHeaderStyle}>Budget</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Duration</th>
                <th style={tableHeaderStyle}>Year</th>
                <th style={{ ...tableHeaderStyle, width: "150px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((movie) => (
                <motion.tr
                  key={movie.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td style={{ ...tableCellStyle, fontWeight: "bold" }}>
                    {movie.title}
                  </td>
                  <td style={tableCellStyle}>{movie.director || "N/A"}</td>
                  <td style={tableCellStyle}>{movie.budget || "N/A"}</td>
                  <td style={tableCellStyle}>{movie.location || "N/A"}</td>
                  <td style={tableCellStyle}>{movie.duration || "N/A"}</td>
                  <td style={tableCellStyle}>{movie.year || "N/A"}</td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => setEditing(movie)}
                      style={{
                        background: "#ffc107",
                        padding: "5px 10px",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "5px",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(movie.id)}
                      style={{
                        background: "#dc3545",
                        padding: "5px 10px",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✏️ Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              style={{
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 5px 25px rgba(0,0,0,0.4)",
                padding: "20px",
                width: "90%",
                maxWidth: "500px",
              }}
            >
              <h3>Edit: {editing.title}</h3>
              <EntryForm
                initial={editing}
                onSave={(data) => handleUpdate(editing.id, data)}
                onCancel={() => setEditing(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Task;
