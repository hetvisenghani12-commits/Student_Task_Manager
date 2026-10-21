import { useEffect, useState } from "react";
import {
  IoStar,
  IoStarOutline,
  IoSearch,
  IoDocumentTextOutline,
  IoCheckmark,
  IoClose,
  IoPencilOutline,
  IoTrashOutline,
} from "react-icons/io5";
import GradientHeader from "../components/GradientHeader";
import Pagination from "../components/Pagination";
import {
  THEME,
  ROLE_ADMIN,
  formatDateString,
  showMsg,
  useBreakpoint,
  itemsPerPageFor,
} from "../theme";

function ImportantToggle({ checked, onToggle }) {
  return (
    <button type="button" className="important-toggle-row" onClick={onToggle}>
      {checked ? (
        <IoStar size={20} color={THEME.accent} />
      ) : (
        <IoStarOutline size={20} color={THEME.textMuted} />
      )}
      Mark as Important
    </button>
  );
}

export default function NotesScreen({ notes, noteActions, currentUser }) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const visibleNotes = isAdmin
    ? notes
    : notes.filter((n) => n.owner === currentUser.email);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteImportant, setNoteImportant] = useState(false);

  const [search, setSearch] = useState("");
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = itemsPerPageFor(useBreakpoint());

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImportant, setEditImportant] = useState(false);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      showMsg("Required", "Please enter a note title.");
      return;
    }
    try {
      await noteActions.addNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        important: noteImportant,
        owner: currentUser.email,
        createdAt: formatDateString(new Date()),
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteImportant(false);
      showMsg("Saved", noteImportant ? "Added to Important Notes." : "Note saved.");
    } catch (error) {
      showMsg("Error", "Could not save the note. Please try again.");
    }
  };

  const toggleImportant = (note) => {
    noteActions.updateNote(note.id, { important: !note.important }).catch(() => {
      showMsg("Error", "Could not update the note. Please try again.");
    });
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await noteActions.deleteNote(id);
    } catch (error) {
      showMsg("Error", "Could not delete the note. Please try again.");
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditImportant(note.important);
  };

  const saveNoteEdit = async (id) => {
    if (!editTitle.trim()) {
      showMsg("Error", "Title cannot be empty.");
      return;
    }
    try {
      await noteActions.updateNote(id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        important: editImportant,
      });
      setEditingNoteId(null);
    } catch (error) {
      showMsg("Error", "Could not save changes. Please try again.");
    }
  };

  const filteredNotes = visibleNotes
    .filter((n) => {
      const query = search.toLowerCase();
      const matchesSearch =
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query);
      const matchesImportant = !showImportantOnly || n.important;
      return matchesSearch && matchesImportant;
    })
    .sort((a, b) => (b.important === a.important ? 0 : b.important ? 1 : -1));

  const importantCount = visibleNotes.filter((n) => n.important).length;

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotes = filteredNotes.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showImportantOnly]);

  return (
    <div className="container">
      <GradientHeader
        title="Notes 🗒️"
        subtitle={`${importantCount} marked important`}
        Icon={IoStar}
      />

      <form className="card form-container" onSubmit={addNote} noValidate>
        <div className="edit-section-title">Quick Note</div>

        <label className="field-label" htmlFor="note-title">
          Title *
        </label>
        <input
          id="note-title"
          className="text-input"
          placeholder="e.g., Exam syllabus reminders"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
        />

        <label className="field-label" htmlFor="note-content">
          Note
        </label>
        <textarea
          id="note-content"
          className="text-input note-content-input"
          placeholder="Write your note here..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        />

        <ImportantToggle
          checked={noteImportant}
          onToggle={() => setNoteImportant(!noteImportant)}
        />

        <button type="submit" className="submit-btn">
          Save Note
        </button>
      </form>

      <div className="search-bar">
        <IoSearch size={18} color={THEME.textMuted} />
        <input
          className="search-field"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button
        type="button"
        className={`filter-chip important-filter ${showImportantOnly ? "active" : ""}`}
        onClick={() => setShowImportantOnly(!showImportantOnly)}
      >
        <IoStar size={12} color={showImportantOnly ? "#FFFFFF" : THEME.accent} />
        Important Notes Only
      </button>

      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          <IoDocumentTextOutline size={40} color={THEME.textMuted} />
          <div className="empty-state-title">No notes yet</div>
          <div className="empty-state-text">Write your first note above.</div>
        </div>
      ) : (
        paginatedNotes.map((note) => (
          <div
            key={note.id}
            className={`card note-card ${note.important ? "important" : ""}`}
          >
            {editingNoteId === note.id ? (
              <div>
                <div className="edit-section-title">Editing Note ✏️</div>

                <label className="field-label">Title</label>
                <input
                  className="text-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <label className="field-label">Note</label>
                <textarea
                  className="text-input note-content-input"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />

                <ImportantToggle
                  checked={editImportant}
                  onToggle={() => setEditImportant(!editImportant)}
                />

                <div className="card-actions">
                  <button
                    type="button"
                    className="action-btn grow"
                    style={{ backgroundColor: THEME.success }}
                    onClick={() => saveNoteEdit(note.id)}
                  >
                    <IoCheckmark size={16} /> Save
                  </button>
                  <button
                    type="button"
                    className="action-btn grow"
                    style={{ backgroundColor: THEME.textMuted }}
                    onClick={() => setEditingNoteId(null)}
                  >
                    <IoClose size={16} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="note-card-top">
                  <div className="note-title">{note.title}</div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={note.important ? "Unmark important" : "Mark important"}
                    onClick={() => toggleImportant(note)}
                  >
                    {note.important ? (
                      <IoStar size={22} color={THEME.accent} />
                    ) : (
                      <IoStarOutline size={22} color={THEME.textMuted} />
                    )}
                  </button>
                </div>

                {note.content ? (
                  <div className="note-content">{note.content}</div>
                ) : null}

                <div className="tag-group">
                  <span className="item-date">📅 {note.createdAt}</span>
                  {isAdmin && note.owner && (
                    <span className="owner-pill">👤 {note.owner}</span>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="action-btn"
                    style={{ backgroundColor: THEME.secondary }}
                    onClick={() => startEditing(note)}
                  >
                    <IoPencilOutline size={16} /> Edit
                  </button>

                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={() => deleteNote(note.id)}
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
