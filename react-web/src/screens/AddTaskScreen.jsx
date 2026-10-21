import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChoiceGroup } from "../components/TaskPills";
import {
  PRIORITY_THEMES,
  PRIORITIES,
  CATEGORIES,
  formatDateString,
  showMsg,
} from "../theme";

export default function AddTaskScreen({ taskActions, currentUser }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(formatDateString(new Date()));
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Study");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showMsg("Required", "Please enter a task title.");
      return;
    }

    const newTask = {
      title: title.trim(),
      description: description.trim() || "No detailed notes added.",
      date,
      priority,
      category,
      completed: false,
      owner: currentUser.email,
    };

    setSaving(true);
    try {
      await taskActions.addTask(newTask);
      setTitle("");
      setDescription("");
      setDate(formatDateString(new Date()));
      setPriority("Medium");
      setCategory("Study");
      showMsg("Success", "Task added to schedule!");
      navigate("/tasks");
    } catch (err) {
      showMsg("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h1 className="screen-header">Create New Task ✍️</h1>

      <form className="card form-container" onSubmit={handleSave} noValidate>
        <label className="field-label" htmlFor="task-title">
          Task Title *
        </label>
        <input
          id="task-title"
          className="text-input"
          placeholder="e.g., Study Operating Systems"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="field-label" htmlFor="task-desc">
          Description
        </label>
        <textarea
          id="task-desc"
          className="text-input multiline-input"
          placeholder="Add details, links, or notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="field-label">Priority Level</label>
        <ChoiceGroup
          options={PRIORITIES}
          value={priority}
          onChange={setPriority}
          colorFor={(p) => PRIORITY_THEMES[p]}
        />

        <label className="field-label">Category</label>
        <ChoiceGroup options={CATEGORIES} value={category} onChange={setCategory} />

        <label className="field-label" htmlFor="task-date">
          Select Due Date Calendar 📅
        </label>
        <div className="date-container">
          <input
            id="task-date"
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? "Saving..." : "Save Task to Calendar"}
        </button>
      </form>
    </div>
  );
}
