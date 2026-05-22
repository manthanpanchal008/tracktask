import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Users, CheckCircle, Clock, AlertCircle, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToTeamTasksByDate } from "../firebase/taskService";
import { subscribeToTeamMembers } from "../firebase/userService";

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

const STATUS_COLOR = {
  completed: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
  pending:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3b82f6" },
  unsolved:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
};

const PRIORITY_DOT = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#10b981",
};

function MemberCard({ member, tasks, isMe }) {
  const [expanded, setExpanded] = useState(false);
  const initials = member.displayName
    ? member.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : member.email?.[0]?.toUpperCase() || "U";

  const total     = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending   = tasks.filter((t) => t.status === "pending").length;
  const unsolved  = tasks.filter((t) => t.status === "unsolved").length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="team-member-card" style={{ border: isMe ? "1px solid rgba(139,92,246,0.4)" : undefined }}>
      {/* Header */}
      <div className="team-member-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Avatar */}
          <div className="team-avatar" style={{ background: isMe ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "linear-gradient(135deg,#334155,#475569)" }}>
            {initials}
            {isMe && <span className="team-me-badge">You</span>}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              {member.displayName}
              {isMe && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--purple-light)", fontWeight: 600 }}>● You</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{member.email}</div>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✅ {completed}</span>
            <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>⏳ {pending}</span>
            {unsolved > 0 && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>❌ {unsolved}</span>}
          </div>
          {/* Progress ring */}
          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke={pct === 100 ? "#10b981" : "#8b5cf6"}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: pct === 100 ? "#10b981" : "var(--text-primary)" }}>
              {pct}%
            </div>
          </div>
          <span style={{ fontSize: 18, color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ margin: "12px 0 0", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#10b981" : "linear-gradient(90deg,#8b5cf6,#6366f1)", borderRadius: 2, transition: "width 0.6s ease" }} />
        </div>
      )}

      {/* Task list (expandable) */}
      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {total === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No tasks for this day
            </div>
          ) : (
            tasks.map((task) => {
              const sc = STATUS_COLOR[task.status] || STATUS_COLOR.pending;
              return (
                <div key={task.id} className="team-task-row" style={{ borderLeft: `3px solid ${PRIORITY_DOT[task.priority] || "#64748b"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_DOT[task.priority] || "#64748b", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: task.status === "completed" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "completed" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {task.category && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(139,92,246,0.12)", color: "var(--purple-light)", border: "1px solid rgba(139,92,246,0.2)", fontWeight: 600 }}>
                        {task.category}
                      </span>
                    )}
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const today = fmt(new Date());
  const [date, setDate]       = useState(today);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    const unsub = subscribeToTeamMembers(setMembers);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToTeamTasksByDate(date, setTasks);
    return () => unsub();
  }, [date]);

  const shiftDate = (days) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(fmt(d));
  };

  const filtered = members.filter((m) =>
    !search ||
    m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Global stats
  const totalTasks     = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  const totalPending   = tasks.filter((t) => t.status === "pending").length;
  const totalUnsolved  = tasks.filter((t) => t.status === "unsolved").length;
  const teamPct        = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team View</h1>
          <p className="page-subtitle">See what everyone is working on</p>
        </div>
      </div>

      {/* Team stats bar */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card purple">
          <Users size={18} style={{ color: "var(--purple-light)" }} />
          <div className="stat-number" style={{ fontSize: 26 }}>{members.length}</div>
          <div className="stat-label">Team Members</div>
        </div>
        <div className="stat-card blue">
          <Clock size={18} style={{ color: "#3b82f6" }} />
          <div className="stat-number" style={{ fontSize: 26, color: "#3b82f6" }}>{totalPending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card green">
          <CheckCircle size={18} style={{ color: "#10b981" }} />
          <div className="stat-number" style={{ fontSize: 26, color: "#10b981" }}>{totalCompleted}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card red">
          <AlertCircle size={18} style={{ color: "#ef4444" }} />
          <div className="stat-number" style={{ fontSize: 26, color: "#ef4444" }}>{totalUnsolved}</div>
          <div className="stat-label">Unsolved</div>
        </div>
      </div>

      {/* Team overall progress */}
      {totalTasks > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Team Progress for {displayDate(date)}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: teamPct === 100 ? "#10b981" : "var(--purple-light)" }}>{teamPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${teamPct}%` }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{totalCompleted} of {totalTasks} tasks completed across the team</div>
        </div>
      )}

      {/* Date navigator + search */}
      <div className="card" style={{ marginBottom: 20, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="date-nav">
            <button className="date-nav-btn" onClick={() => shiftDate(-1)}><ChevronLeft size={16} /></button>
            <div className="date-display">📅 {displayDate(date)}</div>
            <button className="date-nav-btn" onClick={() => shiftDate(1)} disabled={date >= today}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="form-input" style={{ width: "auto" }} />
            <button className="btn btn-secondary btn-sm" onClick={() => setDate(today)} disabled={date === today}>
              <Calendar size={14} /> Today
            </button>
            <div style={{ position: "relative" }}>
              <User size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="search-input"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 30, width: 180 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Member cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div className="tasks-empty">
            <div className="tasks-empty-icon">👥</div>
            <div style={{ fontWeight: 600 }}>No team members found</div>
            <div style={{ fontSize: 13 }}>Members appear here after they sign in for the first time</div>
          </div>
        ) : (
          filtered.map((member) => (
            <MemberCard
              key={member.uid}
              member={member}
              tasks={tasks.filter((t) => t.userId === member.uid)}
              isMe={member.uid === user?.uid}
            />
          ))
        )}
      </div>
    </div>
  );
}
