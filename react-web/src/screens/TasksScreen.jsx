import { useEffect, useState } from "react";
import {
  IoSearch,
  IoSearchOutline,
  IoCheckmark,
  IoClose,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoPencilOutline,
  IoTrashOutline,
} from "react-icons/io5";
import Pagination from "../components/Pagination";
import { PriorityPill, ChoiceGroup } from "../components/TaskPills";
import {
  THEME,
  PRIORITY_THEMES,
  ROLE_ADMIN,
  PRIORITIES,
  CATEGORIES,
  formatDateString,
  parseDateString,
  showMsg,
  useBreakpoint,
  itemsPerPageFor,
} from "../theme";

export default function TasksScreen({ tasks, taskActions, currentUser }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = itemsPerPageFor(useBreakpoint());

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Study");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDate, setEditDate] = useState(formatDateString(new Date()));

  const isAdmin = currentUser.role === ROLE_ADMIN;
  const visibleTasks = isAdmin
    ? tasks
    : tasks.filter((t) => t.owner === currentUser.email);

  const toggleTask = (id, completed) => {
    taskActions
      .updateTask(id, { completed: !completed })
      .catch((e) => showMsg("Error", e.message));
  };

  const deleteTask = (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      taskActions.deleteTask(id).catch((e) => showMsg("Error", e.message));
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditDate(formatDateString(parseDateString(task.date)));
  };

  const saveTaskEdit = (id) => {
    if (!editTitle.trim()) {
      showMsg("Error", "Title cannot be empty.");
      return;
    }
    taskActions
      .updateTask(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || "No detailed notes added.",
        category: editCategory,
        priority: editPriority,
        date: editDate,
      })
      .catch((e) => showMsg("Error", e.message));
    setEditingTaskId(null);
  };

  const filteredTasks = visibleTasks.filter((t) => {
    const query = search.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query);
    const matchesCat = selectedCat === "All" || t.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat]);

  return (
    <div className="container">
      <h1 className="screen-header">
        {isAdmin ? "All Tasks 🗂️" : "My Workspace 📋"}
      </h1>

      <div className="search-bar">
        <IoSearch size={18} color={THEME.textMuted} />
        <input
          className="search-field"
          placeholder="Search task title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-scroll">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip ${selectedCat === cat ? "active" : ""}`}
            onClick={() => setSelectedCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <IoSearchOutline size={40} color={THEME.textMuted} />
          <div className="empty-state-title">No matching tasks</div>
        </div>
      ) : (
        paginatedTasks.map((task) => (
          <div key={task.id} className="card detailed-card">
            {editingTaskId === task.id ? (
              <div>
                <div className="edit-section-title">Editing Task ✏️</div>

                <label className="field-label">Title</label>
                <input
                  className="text-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <label className="field-label">Description</label>
                <textarea
                  className="text-input multiline-input"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />

                <label className="field-label">Priority</label>
                <ChoiceGroup
                  options={PRIORITIES}
                  value={editPriority}
                  onChange={setEditPriority}
                  colorFor={(p) => PRIORITY_THEMES[p]}
                />

                <label className="field-label">Category</label>
                <ChoiceGroup
                  options={CATEGORIES}
                  value={editCategory}
                  onChange={setEditCategory}
                />

                <label className="field-label">Due Date Calendar 📅</label>
                <div className="date-container">
                  <input
                    type="date"
                    className="date-input"
                    value={editDate}
                    onChange={(e) => e.target.value && setEditDate(e.target.value)}
                  />
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="action-btn grow"
                    style={{ backgroundColor: THEME.success }}
                    onClick={() => saveTaskEdit(task.id)}
                  >
                    <IoCheckmark size={16} /> Save
                  </button>
                  <button
                    type="button"
                    className="action-btn grow"
                    style={{ backgroundColor: THEME.textMuted }}
                    onClick={() => setEditingTaskId(null)}
                  >
                    <IoClose size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="tag-group">
                  <PriorityPill priority={task.priority} suffix=" Priority" />
                  <span className="c-pill">{task.category}</span>
                  {isAdmin && task.owner && (
                    <span className="owner-pill">👤 {task.owner}</span>
                  )}
                </div>

                <div className={`item-title ${task.completed ? "strikethrough" : ""}`}>
                  {task.title}
                </div>
                <div className="item-desc">{task.description}</div>
                <div className="item-date">📅 Due Date: {task.date}</div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="action-btn"
                    style={{
                      backgroundColor: task.completed
                        ? THEME.textMuted
                        : THEME.primary,
                    }}
                    onClick={() => toggleTask(task.id, task.completed)}
                  >
                    {task.completed ? (
                      <IoRefreshOutline size={16} />
                    ) : (
                      <IoCheckmarkCircleOutline size={16} />
                    )}
                    {task.completed ? " Undo" : " Complete"}
                  </button>

                  <button
                    type="button"
                    className="action-btn"
                    style={{ backgroundColor: THEME.secondary }}
                    onClick={() => startEditing(task)}
                  >
                    <IoPencilOutline size={16} /> Edit
                  </button>

                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={() => deleteTask(task.id)}
                  >
                    <IoTrashOutline size={16} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
