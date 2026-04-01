function LogoMark({ admin }) {
  return (
    <span className={`logo-mark ${admin ? 'logo-mark--admin' : ''}`} aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function Navbar({ brand, right, admin }) {
  return (
    <header className="app-header">
      <div className="app-header__inner flex-between">
        <div className="app-header__brand">
          <LogoMark admin={admin} />
          <div className="app-header__titles">
            <span className="app-header__name">{brand}</span>
            <span className="app-header__tagline">{admin ? 'Operations console' : 'ESG credit marketplace'}</span>
          </div>
        </div>
        {right ? <div className="app-header__actions">{right}</div> : null}
      </div>
    </header>
  );
}
