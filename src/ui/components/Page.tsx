import type { ReactNode } from 'react';

interface PageProps {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/** Estructura común de todas las pantallas: barra superior + contenido. */
export function Page({ title, onBack, actions, children, wide }: PageProps) {
  return (
    <div className="page">
      <header className="topbar">
        <div className={`topbar-inner ${wide ? 'wide' : ''}`}>
          {onBack && (
            <button className="btn ghost" onClick={onBack} aria-label="Volver">
              ← Volver
            </button>
          )}
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">{actions}</div>
        </div>
      </header>
      <main className={`content ${wide ? 'wide' : ''}`}>{children}</main>
    </div>
  );
}
