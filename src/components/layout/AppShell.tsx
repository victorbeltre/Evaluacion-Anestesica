import type { ReactNode } from 'react';
import type { CurriculumDomain } from '../../data/curriculum';

type AppShellProps = {
  domains: CurriculumDomain[];
  selectedDomainId: string;
  onSelectDomain: (domainId: string) => void;
  children: ReactNode;
  practiceRail: ReactNode;
};

export function AppShell({
  domains,
  selectedDomainId,
  onSelectDomain,
  children,
  practiceRail,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Milaringo home">
          <span className="brand-mark">M</span>
          <span>
            <strong>Milaringo</strong>
            <small>Anesthesia board practice</small>
          </span>
        </a>
        <nav className="topbar-nav" aria-label="Primary">
          <a href="#path">Path</a>
          <a href="#practice">Practice</a>
          <a href="#review">Review</a>
        </nav>
      </header>

      <div className="workspace">
        <aside className="domain-sidebar" aria-label="Curriculum domains">
          <div className="sidebar-heading">
            <span>Curriculum</span>
            <strong>{domains.length}</strong>
          </div>
          <div className="domain-list">
            {domains.map((domain) => (
              <button
                className={domain.id === selectedDomainId ? 'domain-button is-selected' : 'domain-button'}
                aria-pressed={domain.id === selectedDomainId}
                key={domain.id}
                onClick={() => onSelectDomain(domain.id)}
                type="button"
              >
                <span>{domain.shortTitle}</span>
                <small>{domain.nodes.length} lessons</small>
              </button>
            ))}
          </div>

          <section className="medical-disclaimer" aria-label="Medical education disclaimer">
            <strong>Educational use only</strong>
            <p>
              Milaringo is a study aid for anesthesia review. It is not clinical decision support and
              does not replace local protocols, supervision, or expert review.
            </p>
          </section>
        </aside>

        <main className="stage" id="path">
          {children}
        </main>

        {practiceRail}
      </div>
    </div>
  );
}
