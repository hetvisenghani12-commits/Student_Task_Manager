import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { ROLE_ADMIN } from "./theme";
import TabBar from "./components/TabBar";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import TasksScreen from "./screens/TasksScreen";
import AddTaskScreen from "./screens/AddTaskScreen";
import CompletedScreen from "./screens/CompletedScreen";
import NotesScreen from "./screens/NotesScreen";
import AdminUsersScreen from "./screens/AdminUsersScreen";
import ProfileScreen from "./screens/ProfileScreen";

// --- Firestore CRUD helpers, passed down to screens ---
const taskActions = {
  addTask: (data) => addDoc(collection(db, "tasks"), data),
  updateTask: (id, updates) => updateDoc(doc(db, "tasks", id), updates),
  deleteTask: (id) => deleteDoc(doc(db, "tasks", id)),
};
const noteActions = {
  addNote: (data) => addDoc(collection(db, "notes"), data),
  updateNote: (id, updates) => updateDoc(doc(db, "notes", id), updates),
  deleteNote: (id) => deleteDoc(doc(db, "notes", id)),
};
const userActions = {
  updateUser: (uid, updates) => updateDoc(doc(db, "users", uid), updates),
  // Client apps can only remove a user's profile document, not their
  // actual Firebase Auth login — fully deleting an account requires a
  // server-side Admin SDK, which is outside what this app can do.
  deleteUser: (uid) => deleteDoc(doc(db, "users", uid)),
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null); // raw Firebase Auth user
  const [currentUser, setCurrentUser] = useState(null); // merged profile (name/role/course/etc.)
  const [isReady, setIsReady] = useState(false);

  // Watch Firebase Auth sign-in state. Login/logout/signup switch screens
  // automatically, and Firebase keeps the session across reloads.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCurrentUser(null);
        setIsReady(true);
      }
    });
    return unsubscribe;
  }, []);

  // Once we know who's signed in, listen live to their profile document.
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setCurrentUser({ uid: firebaseUser.uid, ...snap.data() });
        }
        setIsReady(true);
      },
      (error) => {
        console.error(error);
        setIsReady(true);
      },
    );
    return unsubscribe;
  }, [firebaseUser]);

  // Live collections — every signed-in device sees the same data instantly.
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubTasks = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubNotes = onSnapshot(collection(db, "notes"), (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => {
      unsubTasks();
      unsubNotes();
      unsubUsers();
    };
  }, [firebaseUser]);

  const handleLogout = () => {
    signOut(auth).catch(console.error);
  };

  if (!isReady) return null;

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isAdmin = currentUser.role === ROLE_ADMIN;

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <HomeScreen
                tasks={
                  isAdmin
                    ? tasks
                    : tasks.filter((t) => t.owner === currentUser.email)
                }
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/tasks"
            element={
              <TasksScreen
                tasks={tasks}
                taskActions={taskActions}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/add-task"
            element={
              <AddTaskScreen taskActions={taskActions} currentUser={currentUser} />
            }
          />
          <Route
            path="/completed"
            element={
              <CompletedScreen
                tasks={tasks}
                taskActions={taskActions}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/notes"
            element={
              <NotesScreen
                notes={notes}
                noteActions={noteActions}
                currentUser={currentUser}
              />
            }
          />
          {isAdmin && (
            <Route
              path="/users"
              element={
                <AdminUsersScreen
                  users={users}
                  userActions={userActions}
                  tasks={tasks}
                  currentUser={currentUser}
                />
              }
            />
          )}
          <Route
            path="/profile"
            element={
              <ProfileScreen
                key={currentUser.uid}
                currentUser={currentUser}
                userActions={userActions}
                onLogout={handleLogout}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar isAdmin={isAdmin} />
    </div>
  );
}
