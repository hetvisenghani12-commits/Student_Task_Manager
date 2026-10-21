import { IoCheckmarkDoneCircleOutline, IoTrashOutline } from "react-icons/io5";
import { THEME, ROLE_ADMIN, showMsg } from "../theme";

export default function CompletedScreen({ tasks, taskActions, currentUser }) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const scoped = isAdmin
    ? tasks
    : tasks.filter((t) => t.owner === currentUser.email);
  const completedList = scoped.filter((t) => t.completed);

  const deleteTask = (id) => {
    if (window.confirm("Remove this completed task?")) {
      taskActions.deleteTask(id).catch((e) => showMsg("Error", e.message));
    }
  };

  return (
    <div className="container">
      <h1 className="screen-header">Completed Tasks 🎉</h1>

      {completedList.length === 0 ? (
        <div className="empty-state">
          <IoCheckmarkDoneCircleOutline size={44} color={THEME.textMuted} />
          <div className="empty-state-title">No finished tasks yet</div>
          <div className="empty-state-text">
            Mark tasks complete to see history.
          </div>
        </div>
      ) : (
        completedList.map((task) => (
          <div key={task.id} className="card completed-card-item">
            <div className="flex-1">
              <span className="c-pill">{task.category}</span>
              <div className="completed-title">✓ {task.title}</div>
              <div className="item-desc">{task.description}</div>
              <div className="item-date">Completed Due: {task.date}</div>
              {isAdmin && task.owner && (
                <span className="owner-pill owner-pill-spaced">
                  👤 {task.owner}
                </span>
              )}
            </div>

            <button
              type="button"
              className="icon-btn delete-icon-btn"
              aria-label="Delete task"
              onClick={() => deleteTask(task.id)}
            >
              <IoTrashOutline size={20} color={THEME.danger} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
