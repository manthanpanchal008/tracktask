import React, { useState, useEffect } from "react";
import { X, Plus, Upload } from "lucide-react";
import { addTask, updateTask, importTasksFromArray } from "../../firebase/taskService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const EMPTY = { title: "", description: "", priority: "medium", category: "General", dueDate: "", taskDate: "" };
const CATEGORIES = ["General", "Development", "Design", "Meeting", "Research", "Review", "Testing", "Documentation", "Other"];

export default function AddTaskModal({ onClose, editTask, defaultDate }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("manual"); // manual | import

  useEffect(() => {
    if (editTask) {
      setForm({ title: editTask.title, description: editTask.description || "", priority: editTask.priority || "medium", category: editTask.category || "General", dueDate: editTask.dueDate || "", taskDate: editTask.taskDate || defaultDate });
    } else {
      setForm({ ...EMPTY, taskDate: defaultDate });
    }
  }, [editTask, defaultDate]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Task title is required"); return; }
    setLoading(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, { title: form.title.trim(), description: form.description, priority: form.priority, category: form.category, dueDate: form.dueDate || null, taskDate: form.taskDate });
        toast.success("Task updated ✏️");
      } else {
        await addTask(user.uid, { ...form, title: form.title.trim() });
        toast.success("Task added 🎯");
      }
      onClose();
    } catch { toast.error("Failed to save task"); }
    finally { setLoading(false); }
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        if (!data.length) { toast.error("No data found in file"); return; }
        setLoading(true);
        await importTasksFromArray(user.uid, data, form.taskDate || defaultDate);
        toast.success(`${data.length} tasks imported! 📊`);
        onClose();
      } catch { toast.error("Failed to import file"); }
      finally { setLoading(false); }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{editTask ? "✏️" : "🎯"}</span>
          {editTask ? "Edit Task" : "Add New Task"}
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {!editTask && (
          <div className="auth-tabs" style={{ marginBottom: 20 }}>
            <button className={`auth-tab ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>Manual Entry</button>
            <button className={`auth-tab ${tab === "import" ? "active" : ""}`} onClick={() => setTab("import")}>Import Excel/CSV</button>
          </div>
        )}

        {tab === "import" && !editTask ? (
          <div>
            <div className="form-group">
              <label className="form-label">Task Date</label>
              <input name="taskDate" type="date" value={form.taskDate} onChange={handle} className="form-input" />
            </div>
            <label className="upload-area" style={{ display: "block" }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} style={{ display: "none" }} />
              <div className="upload-icon">📂</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload Excel / CSV</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Required columns: Title, Description (optional), Priority, Category</div>
            </label>
            <div style={{ marginTop: 16, padding: 12, background: "rgba(139,92,246,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text-muted)" }}>
              💡 <strong>Excel Format:</strong> Columns — <code>Title</code>, <code>Description</code>, <code>Priority</code> (high/medium/low), <code>Category</code>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input name="title" value={form.title} onChange={handle} placeholder="What needs to be done?" className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" value={form.description} onChange={handle} placeholder="Add more details..." className="form-textarea" rows={3} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" value={form.priority} onChange={handle} className="form-select">
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" value={form.category} onChange={handle} className="form-select">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Task Date</label>
                <input name="taskDate" type="date" value={form.taskDate} onChange={handle} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input name="dueDate" type="date" value={form.dueDate} onChange={handle} className="form-input" />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : editTask ? "Update Task" : <><Plus size={16} /> Add Task</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
