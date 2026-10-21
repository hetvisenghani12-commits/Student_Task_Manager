import { IoPeople, IoSwapHorizontalOutline, IoTrashOutline } from "react-icons/io5";
import GradientHeader from "../components/GradientHeader";
import { THEME, ROLE_ADMIN, ROLE_USER, showMsg } from "../theme";

export default function AdminUsersScreen({ users, userActions, tasks, currentUser }) {
  const toggleRole = async (u) => {
    if (u.uid === currentUser.uid) {
      showMsg("Not Allowed", "You cannot change your own role.");
      return;
    }
    try {
      await userActions.updateUser(u.uid, {
        role: u.role === ROLE_ADMIN ? ROLE_USER : ROLE_ADMIN,
      });
    } catch (error) {
      showMsg("Error", "Could not update role. Please try again.");
    }
  };

  const deleteUser = async (u) => {
    if (u.uid === currentUser.uid) {
      showMsg("Not Allowed", "You cannot delete your own account.");
      return;
    }
    if (
      !window.confirm(
        "Remove this user's profile? (Their login will still exist, but their profile data will be gone.)",
      )
    )
      return;
    try {
      await userActions.deleteUser(u.uid);
    } catch (error) {
      showMsg("Error", "Could not remove this user. Please try again.");
    }
  };

  return (
    <div className="container">
      <GradientHeader
        title="User Management 🛡️"
        subtitle={`${users.length} registered accounts`}
        Icon={IoPeople}
      />

      {users.map((u) => {
        const userTaskCount = tasks.filter((t) => t.owner === u.email).length;
        const userIsAdmin = u.role === ROLE_ADMIN;
        return (
          <div key={u.uid} className="card user-card">
            <div className="user-card-top">
              <div className="user-avatar-small">
                {(u.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="user-card-name">{u.name}</div>
                <div className="user-card-email">{u.email}</div>
              </div>
              <span
                className="role-tag"
                style={{
                  backgroundColor: userIsAdmin ? THEME.primaryLight : "#F0F0F0",
                  color: userIsAdmin ? THEME.primaryDark : THEME.textMuted,
                }}
              >
                {userIsAdmin ? "Admin" : "User"}
              </span>
            </div>

            <div className="user-card-meta">
              {u.course} · {userTaskCount} task{userTaskCount !== 1 ? "s" : ""}
            </div>

            <div className="card-actions">
              <button
                type="button"
                className="action-btn"
                style={{ backgroundColor: THEME.secondary }}
                onClick={() => toggleRole(u)}
              >
                <IoSwapHorizontalOutline size={16} />
                {userIsAdmin ? " Make User" : " Make Admin"}
              </button>

              <button
                type="button"
                className="action-btn danger"
                onClick={() => deleteUser(u)}
              >
                <IoTrashOutline size={16} /> Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
