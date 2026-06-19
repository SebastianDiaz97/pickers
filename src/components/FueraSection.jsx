import React, { useState } from 'react';

export default function FueraSection({ items, onRestaurar, onEliminar, onRestaurarTodos }) {
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fuera-section">
      <div className="fuera-header" onClick={() => setCollapsed((c) => !c)}>
        <span>⏸️ Fuera del turno</span>
        <span>{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
        <div className="fuera-body">
          {items.map((picker) => (
            <span key={picker.id} className="fuera-chip entering">
              {picker.nombre}
              <button
                className="btn-chip"
                onClick={() => onRestaurar(picker.id)}
                title="Restaurar al turno"
              >
                ✅
              </button>
              <button
                className="btn-chip-danger"
                onClick={() => onEliminar(picker.id)}
                title="Eliminar del turno permanentemente"
              >
                🗑️
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ padding: '4px 16px 10px' }}>
        <button className="btn btn-outline btn-sm" onClick={onRestaurarTodos}>
          🔄 Restaurar todos
        </button>
      </div>
    </div>
  );
}
