import { NavLink } from "react-router-dom";

import { useMe } from "../../hooks/useMe";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "sidebar__link is-active" : "sidebar__link";

export default function Sidebar() {
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";

  return (
    <aside className="shell__sidebar">
      <div className="sidebar__group">
        <div className="sidebar__heading">Time tracking</div>
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={linkClass}>
          Tasks
        </NavLink>
        <NavLink to="/tasks/new" className={linkClass}>
          New entry
        </NavLink>
        <NavLink to="/reports" className={linkClass}>
          Reports
        </NavLink>
      </div>
      <div className="sidebar__group">
        <div className="sidebar__heading">Configuration</div>
        <NavLink to="/projects" className={linkClass}>
          Projects
        </NavLink>
        {isAdmin ? (
          <NavLink to="/users" className={linkClass}>
            Users
          </NavLink>
        ) : null}
      </div>
    </aside>
  );
}
