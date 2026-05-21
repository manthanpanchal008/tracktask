import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTasksByDate } from "../firebase/taskService";
import TaskCard from "../components/Tasks/TaskCard";
import AddTaskModal from "../components/Tasks/AddTaskModal";

function fmt(date) {
  return date.toISOString().split("T")[0];
}

function displayDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function TasksPage() {
  const { user } = useAuth();
  const today = fmt(new Date());
  const [date, setDate] = useState(today);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTasksByDate(user.uid, date, setTasks);
    return () => unsub();
  }, [user, date]);

  const shiftDate = (days) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(fmt(d));
  };

  const filtered = tasks.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    unsolved: tasks.filter((t) => t.status === "unsolved").length,
  };

  const openAdd = () => { setEditTask(null); setShowModal(true); };
  const openEdit = (t) => { setEditTask(t); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTask(null); };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Manager</h1>
          <p className="page-subtitle">Manage and track your daily tasks</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-task-btn">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Date Navigation */}
      <div className="card" style={{ marginBottom: 20, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="date-nav">
            <button className="date-nav-btn" onClick={() => shiftDate(-1)}><ChevronLeft size={16} /></button>
            <div className="date-display">
              📅 {displayDate(date)}
            </div>
            <button className="date-nav-btn" onClick={() => shiftDate(1)} disabled={date >= today}><ChevronRight size={16} /></button>
          </div>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="form-input" style={{ width: "auto" }} />
          <button className="btn btn-secondary btn-sm" onClick={() => setDate(today)} disabled={date === today}>
            <Calendar size={14} /> Go to Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {[["all", "All"], ["pending", "Pending"], ["completed", "Completed"], ["unsolved", "Unsolved"]].map(([val, label]) => (
          <button key={val} className={`filter-chip ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>
            {label} <span style={{ opacity: 0.7 }}>({counts[val]})</span>
          </button>
        ))}
        <div className="search-input-wrap" style={{ marginLeft: "auto" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input className="search-input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="tasks-empty">
          <div className="tasks-empty-icon">📋</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {tasks.length === 0 ? "No tasks for this day" : "No tasks match your filter"}
          </div>
          <div style={{ fontSize: 13 }}>
            {tasks.length === 0 ? "Click \"Add Task\" to get started" : "Try changing the filter or search query"}
          </div>
          {tasks.length === 0 && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>
              <Plus size={16} /> Add First Task
            </button>
          )}
        </div>
      ) : (
        <div className="tasks-list">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={openEdit} />
          ))}
        </div>
      )}

      {showModal && <AddTaskModal onClose={closeModal} editTask={editTask} defaultDate={date} />}
    </div>
  );
}
