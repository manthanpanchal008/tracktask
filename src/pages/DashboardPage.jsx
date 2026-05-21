import React, { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, AlertCircle, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTasksByDate, subscribeToAllTasks } from "../firebase/taskService";
import AddTaskModal from "../components/Tasks/AddTaskModal";
import TaskCard from "../components/Tasks/TaskCard";
import { useNavigate } from "react-router-dom";

function fmt(d) { return d.toISOString().split("T")[0]; }

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = fmt(new Date());
  const [todayTasks, setTodayTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToTasksByDate(user.uid, today, setTodayTasks);
    const u2 = subscribeToAllTasks(user.uid, setAllTasks);
    return () => { u1(); u2(); };
  }, [user]);

  const completed = todayTasks.filter((t) => t.status === "completed").length;
  const pending = todayTasks.filter((t) => t.status === "pending").length;
  const unsolved = todayTasks.filter((t) => t.status === "unsolved").length;
  const pct = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;

  // 7-day streak
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = fmt(d);
    const dayTasks = allTasks.filter((t) => t.taskDate === dateStr);
    const done = dayTasks.filter((t) => t.status === "completed").length;
    return { date: dateStr, label: d.toLocaleDateString("en-US", { weekday: "short" }), total: dayTasks.length, done };
  });

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greet()}, {user?.displayName?.split(" ")[0] || "there"} 👋</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }} id="dashboard-add-btn">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon"><Zap size={40} /></div>
          <div className="stat-number" style={{ color: "var(--purple-light)" }}>{todayTasks.length}</div>
          <div className="stat-label">Total Today</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle size={40} /></div>
          <div className="stat-number" style={{ color: "var(--green)" }}>{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon"><Clock size={40} /></div>
          <div className="stat-number" style={{ color: "var(--yellow)" }}>{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><AlertCircle size={40} /></div>
          <div className="stat-number" style={{ color: "var(--red)" }}>{unsolved}</div>
          <div className="stat-label">Unsolved</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><TrendingUp size={40} /></div>
          <div className="stat-number" style={{ color: "var(--blue)" }}>{allTasks.length}</div>
          <div className="stat-label">All Time Tasks</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Completion Ring */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="completion-ring">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="10"
                strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--purple)" />
                  <stop offset="100%" stopColor="var(--green)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="completion-ring-text">
              <div className="completion-pct" style={{ background: "linear-gradient(135deg,var(--purple-light),var(--green))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pct}%</div>
              <div className="completion-lbl">Done</div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Today's Progress</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>✅ {completed} completed</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>⏳ {pending} pending</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>❌ {unsolved} unsolved</div>
          </div>
        </div>

        {/* 7-day chart */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} style={{ color: "var(--purple)" }} /> Last 7 Days
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {weeklyData.map((d) => {
              const h = d.total ? Math.max(10, (d.done / d.total) * 70) : 4;
              return (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: h, background: d.total ? "linear-gradient(180deg, var(--purple), var(--indigo))" : "var(--bg-secondary)", borderRadius: 4, transition: "height 0.5s ease" }} title={`${d.done}/${d.total} done`} />
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's tasks preview */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="section-title" style={{ flex: 1 }}>Today's Tasks</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/tasks")} style={{ marginLeft: 12 }}>View All</button>
      </div>

      {todayTasks.length === 0 ? (
        <div className="tasks-empty">
          <div className="tasks-empty-icon">🌅</div>
          <div style={{ fontWeight: 600 }}>No tasks for today yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Start your day by adding your first task!</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditTask(null); setShowModal(true); }}>
            <Plus size={16} /> Add First Task
          </button>
        </div>
      ) : (
        <div className="tasks-list">
          {todayTasks.slice(0, 5).map((t) => (
            <TaskCard key={t.id} task={t} onEdit={(t) => { setEditTask(t); setShowModal(true); }} />
          ))}
          {todayTasks.length > 5 && (
            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/tasks")}>
              View {todayTasks.length - 5} more tasks →
            </button>
          )}
        </div>
      )}

      {showModal && <AddTaskModal onClose={() => { setShowModal(false); setEditTask(null); }} editTask={editTask} defaultDate={today} />}
    </div>
  );
}
