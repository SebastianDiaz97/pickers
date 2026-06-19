import React from 'react';

export default function Stats({ disponibles, enPedido, fuera }) {
  return (
    <div className="stats">
      <div className="stat-card">
        ✅ Disponibles
        <span className="num green">{disponibles.length}</span>
      </div>
      <div className="stat-card">
        📦 En Pedido
        <span className="num blue">{enPedido.length}</span>
      </div>
      <div className="stat-card">
        ⏸️ Fuera
        <span className="num orange">{fuera.length}</span>
      </div>
    </div>
  );
}
