import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, Trash2, Edit2, RotateCcw } from "lucide-react";
import { updateTaskStatus, deleteTask } from "../../firebase/taskService";
import toast from "react-hot-toast";

const PRIORITY_BADGE = {
  high: "badge badge-red",
  medium: "badge badge-yellow",
  low: "badge badge-green",
};

const STATUS_BADGE = {
  pending: "badge badge-blue",
  completed: "badge badge-green",
  unsolved: "badge badge-red",
};

export default function TaskCard({ task, onEdit }) {
  const [loading, setLoading] = useState(false);

  const act = async (fn, msg) => {
    setLoading(true);
    try { await fn(); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setLoading(false); }
  };

  const markDone = () => act(() => updateTaskStatus(task.id, "completed"), "Task completed! ✅");
  const markUnsolved = () => act(() => updateTaskStatus(task.id, "unsolved"), "Marked as unsolved");
  const markPending = () => act(() => updateTaskStatus(task.id, "pending"), "Moved back to pending");
  const remove = () => {
    if (window.confirm("Delete this task?"))
      act(() => deleteTask(task.id), "Task deleted");
  };

  const isCompleted = task.status === "completed";
  const isUnsolved = task.status === "unsolved";

  return (
    <div className={`task-card priority-${task.priority} ${isCompleted ? "completed" : ""}`} style={isUnsolved ? { borderColor: "rgba(239,68,68,0.3)" } : {}}>
      {/* Checkbox */}
      <button
        className={`task-checkbox ${isCompleted ? "checked" : ""}`}
        onClick={isCompleted ? markPending : markDone}
        disabled={loading}
        title={isCompleted ? "Mark as pending" : "Mark as complete"}
      >
        {isCompleted && <CheckCircle size={14} color="white" />}
      </button>

      {/* Body */}
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          <span className={PRIORITY_BADGE[task.priority] || "badge badge-gray"}>{task.priority}</span>
          <span className={STATUS_BADGE[task.status] || "badge badge-gray"}>{task.status}</span>
          {task.category && <span className="badge badge-purple">{task.category}</span>}
          {task.dueDate && (
            <span className="badge badge-gray" style={{ gap: 4 }}>📅 {task.dueDate}</span>
          )}
          {isCompleted && task.completedAt && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Done at {new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions">
        {!isCompleted && (
          <button className="btn-icon tooltip" data-tip="Mark Unsolved" onClick={() => act(() => updateTaskStatus(task.id, "unsolved"), "Marked as unsolved")} disabled={loading}>
            <RotateCcw size={14} />
          </button>
        )}
        {isCompleted && (
          <button className="btn-icon tooltip" data-tip="Reopen" onClick={markPending} disabled={loading}>
            <RotateCcw size={14} style={{ color: "var(--yellow)" }} />
          </button>
        )}
        <button className="btn-icon tooltip" data-tip="Edit" onClick={() => onEdit(task)} disabled={loading}>
          <Edit2 size={14} />
        </button>
        <button className="btn-icon tooltip" data-tip="Delete" onClick={remove} disabled={loading} style={{ color: "var(--red)" }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
