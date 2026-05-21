import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

const TASKS_COLLECTION = "tasks";

// Add a new task
export const addTask = async (userId, taskData) => {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    userId,
    title: taskData.title,
    description: taskData.description || "",
    priority: taskData.priority || "medium",
    category: taskData.category || "General",
    status: "pending",
    dueDate: taskData.dueDate || null,
    taskDate: taskData.taskDate || new Date().toISOString().split("T")[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
    tags: taskData.tags || [],
  });
  return docRef.id;
};

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, {
    status,
    completedAt: status === "completed" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
};

// Update full task
export const updateTask = async (taskId, taskData) => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, {
    ...taskData,
    updatedAt: serverTimestamp(),
  });
};

// Delete a task
export const deleteTask = async (taskId) => {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
};

// Get tasks for a user on a specific date (realtime)
export const subscribeToTasksByDate = (userId, date, callback) => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where("userId", "==", userId),
    where("taskDate", "==", date),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      completedAt: doc.data().completedAt?.toDate?.() || null,
    }));
    callback(tasks);
  });
};

// Get all tasks for a user (for history)
export const subscribeToAllTasks = (userId, callback) => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      completedAt: doc.data().completedAt?.toDate?.() || null,
    }));
    callback(tasks);
  });
};

// Import tasks from Excel data
export const importTasksFromArray = async (userId, tasksArray, date) => {
  const promises = tasksArray.map((task) =>
    addDoc(collection(db, TASKS_COLLECTION), {
      userId,
      title: task.title || task.Title || "Untitled Task",
      description: task.description || task.Description || "",
      priority: (task.priority || task.Priority || "medium").toLowerCase(),
      category: task.category || task.Category || "General",
      status: "pending",
      dueDate: null,
      taskDate: date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
      tags: [],
    })
  );
  await Promise.all(promises);
};
