import {
  IoShieldCheckmark,
  IoRocket,
  IoJournalOutline,
  IoTimeOutline,
  IoCheckmarkDoneCircleOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import GradientHeader from "../components/GradientHeader";
import { PriorityPill } from "../components/TaskPills";
import { THEME, ROLE_ADMIN } from "../theme";

export default function HomeScreen({ tasks, currentUser }) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="container">
      <GradientHeader
        title={`Hi, ${currentUser.name.split(" ")[0]} 👋`}
        subtitle={
          isAdmin ? "Admin Dashboard Overview" : "Here is your study roadmap"
        }
        Icon={isAdmin ? IoShieldCheckmark : IoRocket}
      />

      <div className="card progress-card">
        <div className="progress-header">
          <div>
            <div className="progress-label">Overall Completion</div>
            <div className="progress-sub-label">
              {completed} of {total} tasks finished
            </div>
          </div>
          <div className="progress-value">{progressPercent}%</div>
        </div>
        <div className="track-bar">
          <div className="fill-bar" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid-container">
        <div className="card metric-card" style={{ borderLeftColor: THEME.primary }}>
          <IoJournalOutline size={22} color={THEME.primary} />
          <div className="metric-number">{total}</div>
          <div className="metric-title">Total Tasks</div>
        </div>

        <div className="card metric-card" style={{ borderLeftColor: THEME.warning }}>
          <IoTimeOutline size={22} color={THEME.warning} />
          <div className="metric-number" style={{ color: THEME.warning }}>
            {pending}
          </div>
          <div className="metric-title">Pending</div>
        </div>

        <div className="card metric-card" style={{ borderLeftColor: THEME.success }}>
          <IoCheckmarkDoneCircleOutline size={22} color={THEME.success} />
          <div className="metric-number" style={{ color: THEME.success }}>
            {completed}
          </div>
          <div className="metric-title">Completed</div>
        </div>
      </div>

      <h2 className="section-heading">
        {isAdmin ? "All Users' Tasks" : "Upcoming Tasks"}
      </h2>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <IoSparklesOutline size={40} color={THEME.textMuted} />
          <div className="empty-state-title">All caught up!</div>
          <div className="empty-state-text">
            Add new tasks to organize your schedule.
          </div>
        </div>
      ) : (
        tasks.slice(0, 5).map((task) => (
          <div key={task.id} className="card task-list-item">
            <div className="tag-group">
              <PriorityPill priority={task.priority} />
              <span className="c-pill">{task.category}</span>
              {isAdmin && task.owner && (
                <span className="owner-pill">{task.owner}</span>
              )}
            </div>
            <div className={`item-title ${task.completed ? "strikethrough" : ""}`}>
              {task.title}
            </div>
            <div className="item-date">📅 Due: {task.date}</div>
          </div>
        ))
      )}
    </div>
  );
}
