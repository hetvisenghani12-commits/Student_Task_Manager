import { NavLink } from "react-router-dom";
import {
  IoGrid,
  IoGridOutline,
  IoListSharp,
  IoListOutline,
  IoAddCircle,
  IoAddCircleOutline,
  IoCheckmarkDoneCircle,
  IoCheckmarkDoneCircleOutline,
  IoStar,
  IoStarOutline,
  IoPeople,
  IoPeopleOutline,
  IoPerson,
  IoPersonOutline,
} from "react-icons/io5";
import { useBreakpoint } from "../theme";

// Bottom tab bar — replaces React Navigation's bottom-tabs navigator.
// Shorter labels on phone so 6-7 tabs fit without crowding or wrapping.
const TABS = [
  { to: "/", label: "Home", short: "Home", Icon: IoGridOutline, ActiveIcon: IoGrid },
  { to: "/tasks", label: "Tasks", short: "Tasks", Icon: IoListOutline, ActiveIcon: IoListSharp },
  { to: "/add-task", label: "Add Task", short: "Add", Icon: IoAddCircleOutline, ActiveIcon: IoAddCircle },
  {
    to: "/completed",
    label: "Completed",
    short: "Done",
    Icon: IoCheckmarkDoneCircleOutline,
    ActiveIcon: IoCheckmarkDoneCircle,
  },
  { to: "/notes", label: "Notes", short: "Notes", Icon: IoStarOutline, ActiveIcon: IoStar },
  { to: "/users", label: "Users", short: "Users", Icon: IoPeopleOutline, ActiveIcon: IoPeople, adminOnly: true },
  { to: "/profile", label: "Profile", short: "Profile", Icon: IoPersonOutline, ActiveIcon: IoPerson },
];

export default function TabBar({ isAdmin }) {
  const isPhone = useBreakpoint() === "phone";

  return (
    <nav className={`tab-bar ${isPhone ? "phone" : ""}`}>
      {TABS.filter((tab) => !tab.adminOnly || isAdmin).map(
        ({ to, label, short, Icon, ActiveIcon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `tab-item ${isActive ? "active" : ""}`}
          >
            {({ isActive }) => (
              <>
                <span className="tab-icon-wrap">
                  {isActive ? (
                    <ActiveIcon size={isPhone ? 19 : 23} />
                  ) : (
                    <Icon size={isPhone ? 19 : 23} />
                  )}
                </span>
                <span className="tab-label">{isPhone ? short : label}</span>
              </>
            )}
          </NavLink>
        ),
      )}
    </nav>
  );
}
