import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToAllTasks } from "../firebase/taskService";
import TaskCard from "../components/Tasks/TaskCard";
import AddTaskModal from "../components/Tasks/AddTaskModal";
import { Search, Filter } from "lucide-react";

function fmt(d) { return d.toISOString().split("T")[0]; }

function groupByDate(tasks) {
  return tasks.reduce((acc, t) => {
    const key = t.taskDate || fmt(new Date(t.createdAt));
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
}

function displayDate(dateStr) {
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToAllTasks(user.uid, setAllTasks);
    return () => unsub();
  }, [user]);

  const filtered = allTasks.filter((t) => {
    const matchF = filter === "all" || t.status === filter;
    const matchS = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalCompleted = allTasks.filter((t) => t.status === "completed").length;
  const totalUnsolved = allTasks.filter((t) => t.status === "unsolved").length;
  const totalDays = new Set(allTasks.map((t) => t.taskDate)).size;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task History</h1>
          <p className="page-subtitle">Browse all tasks across time • {totalDays} days tracked</p>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: "14px 18px" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--purple-light)" }}>{allTasks.length}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Tasks</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: "14px 18px" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--green)" }}>{totalCompleted}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Completed</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: "14px 18px" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--red)" }}>{totalUnsolved}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Unsolved</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: "14px 18px" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>{totalDays}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Days Active</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: 24 }}>
        {[["all", "All"], ["pending", "Pending"], ["completed", "Completed"], ["unsolved", "Unsolved"]].map(([v, l]) => (
          <button key={v} className={`filter-chip ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
        <div className="search-input-wrap" style={{ marginLeft: "auto" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="search-input" placeholder="Search by title or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grouped history */}
      {sortedDates.length === 0 ? (
        <div className="tasks-empty">
          <div className="tasks-empty-icon">📜</div>
          <div style={{ fontWeight: 600 }}>No history found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Tasks you add will appear here grouped by day</div>
        </div>
      ) : (
        sortedDates.map((date) => {
          const dayTasks = grouped[date];
          const done = dayTasks.filter((t) => t.status === "completed").length;
          const pct = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
          return (
            <div key={date} className="history-day">
              <div className="history-day-header">
                <div className="history-day-label">
                  📅 {displayDate(date)}
                </div>
                <span className="badge badge-purple">{done}/{dayTasks.length} done • {pct}%</span>
                <div className="history-day-line" />
              </div>
              <div className="tasks-list">
                {dayTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onEdit={(t) => { setEditTask(t); setShowModal(true); }} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {showModal && <AddTaskModal onClose={() => { setShowModal(false); setEditTask(null); }} editTask={editTask} defaultDate={fmt(new Date())} />}
    </div>
  );
}
