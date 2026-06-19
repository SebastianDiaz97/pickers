import React from 'react';

export default function Header({ onNuevoTurno, onLogout, user }) {
  return (
    <header className="header">
      <h1>
        🛒 Gestor de Pickers
        <span>Turno</span>
      </h1>
      <p>Arrastra para reordenar • Asigna pedidos con un clic</p>
      <div className="reset-bar">
        {user && (
          <span className="user-badge" title={user.email}>
            👤 {user.email}
          </span>
        )}
        {onLogout && (
          <button className="btn btn-logout btn-sm" onClick={onLogout}>
            🚪 Salir
          </button>
        )}
        <button className="btn btn-reset btn-sm" onClick={onNuevoTurno}>
          🗑️ Nuevo Turno
        </button>
      </div>
    </header>
  );
}
