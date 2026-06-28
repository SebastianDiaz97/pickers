import React, { useState } from 'react';

export default function PedidoColumn({ items, onFinalizar }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = searchQuery.trim()
    ? items.filter((p) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  return (
    <div className="column column-blue">
      <div className="column-header blue">
        <span>📦 En Pedido</span>
        <span className="badge">{items.length}</span>
      </div>
      <div className="column-search">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="column-body">
        {filteredItems.length === 0 ? (
          <p className="picker-list-empty">
            {searchQuery.trim()
              ? '🔍 No se encontraron pickers con ese nombre.'
              : '📭 No hay pedidos asignados.<br />Presiona "Asignar Pedido".'
            }
          </p>
        ) : (
          <ul className="picker-list">
            {filteredItems.map((picker) => (
              <li key={picker.id} className="picker-item entering" data-id={picker.id}>
                <span className="picker-status" />
                <span className="name">{picker.nombre}</span>
                <span className="pedidos-count" title="Pedidos completados hoy">
                  {picker.pedidos_completados || 0} ✅
                </span>
                <div className="actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onFinalizar(picker.id)}
                    title="Finalizar pedido"
                  >
                    ✅ Finalizar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
