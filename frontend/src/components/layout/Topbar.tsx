import { useAuth } from "react-oidc-context";

import { useMe } from "../../hooks/useMe";

export default function Topbar() {
  const auth = useAuth();
  const { data: me } = useMe();

  return (
    <header className="shell__topbar">
      <span className="topbar__brand">
        <span className="topbar__brand-mark">FTS</span>
        Flow Time System
      </span>
      <div className="topbar__spacer" />
      <div className="topbar__user">
        {me ? (
          <>
            <span className="topbar__user-email">{me.email}</span>
            <span className="topbar__role">{me.role}</span>
          </>
        ) : null}
        <button
          type="button"
          className="topbar__btn"
          onClick={() => void auth.signoutRedirect()}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
