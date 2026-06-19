import React from 'react';

export default function PedidoColumn({ items, onFinalizar }) {
  return (
    <div className="column column-blue">
      <div className="column-header blue">
        <span>📦 En Pedido</span>
        <span className="badge">{items.length}</span>
      </div>
      <div className="column-body">
        {items.length === 0 ? (
          <p className="picker-list-empty">
            📭 No hay pedidos asignados.<br />
            Presiona "Asignar Pedido".
          </p>
        ) : (
          <ul className="picker-list">
            {items.map((picker) => (
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
