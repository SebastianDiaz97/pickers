import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';

export default function DisponiblesColumn({ items, onSacarFuera, onReordenar, onMoverArriba, onLiberarPicker }) {
  const dragRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef(null);
  const prevPositions = useRef({});
  const shouldAnimate = useRef(false);

  const filteredItems = searchQuery.trim()
    ? items.filter((p) => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  // ===================================================================
  // FLIP ANIMATION
  // ===================================================================
  const capturePositions = useCallback(() => {
    if (!listRef.current) return;
    const pos = {};
    listRef.current.querySelectorAll('.picker-item').forEach((el) => {
      const id = el.dataset.id;
      if (id) pos[id] = el.getBoundingClientRect().top;
    });
    prevPositions.current = pos;
  }, []);

  useLayoutEffect(() => {
    if (!shouldAnimate.current || !listRef.current) return;
    shouldAnimate.current = false;

    listRef.current.querySelectorAll('.picker-item').forEach((el) => {
      const id = el.dataset.id;
      if (!id) return;
      const oldTop = prevPositions.current[id];
      const newTop = el.getBoundingClientRect().top;
      if (oldTop !== undefined && Math.abs(oldTop - newTop) > 1) {
        const diff = oldTop - newTop;
        el.style.transition = 'none';
        el.style.transform = `translateY(${diff}px)`;
        el.offsetHeight;
        el.style.transition = 'transform 0.35s ease';
        el.style.transform = '';
        const clean = () => { el.style.transition = ''; el.style.transform = ''; el.removeEventListener('transitionend', clean); };
        el.addEventListener('transitionend', clean, { once: true });
      }
      prevPositions.current[id] = newTop;
    });
  }, [items]);

  // ===================================================================
  // LIMPIAR INDICADORES
  // ===================================================================
  const limpiaIndicadores = useCallback(() => {
    document.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));
    document.querySelectorAll('.drop-before').forEach((el) => el.classList.remove('drop-before'));
  }, []);

  // ===================================================================
  // DRAG & DROP
  // ===================================================================
  const handleDragStart = useCallback((e, id) => {
    dragRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    requestAnimationFrame(() => {
      e.target.closest('.picker-item')?.classList.add('dragging');
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    limpiaIndicadores();
  }, [limpiaIndicadores]);

  const handleDragEnter = useCallback((e, id) => {
    if (id === dragRef.current) return;
    e.preventDefault();

    // Limpiar indicador del item anterior
    document.querySelectorAll('.drop-before').forEach((el) => el.classList.remove('drop-before'));

    const item = e.target.closest('.picker-item');
    if (item) {
      item.classList.add('drop-before');
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // No necesitamos actualizar nada aquí, la linea siempre es arriba
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drop-before');
    }
  }, []);

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault();
      const sourceId = dragRef.current;
      if (sourceId && sourceId !== targetId) {
        capturePositions();
        shouldAnimate.current = true;
        onReordenar(sourceId, targetId, 'before');
      }
      dragRef.current = null;
      limpiaIndicadores();
    },
    [onReordenar, capturePositions, limpiaIndicadores]
  );

  // ===================================================================
  // TOUCH DRAG
  // ===================================================================
  const touchRef = useRef({ id: null, targetId: null });

  const handleTouchStart = useCallback((e, id) => {
    touchRef.current = { id, targetId: null };
    dragRef.current = id;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current.id) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const item = el.closest('.picker-item');
    if (!item) return;
    const belowId = item.dataset.id;
    if (!belowId || belowId === touchRef.current.id) return;

    document.querySelectorAll('.drop-before').forEach((el2) => el2.classList.remove('drop-before'));
    item.classList.add('drop-before');
    touchRef.current.targetId = belowId;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { id, targetId } = touchRef.current;
    if (targetId && id && targetId !== id) {
      capturePositions();
      shouldAnimate.current = true;
      onReordenar(id, targetId, 'before');
    }
    dragRef.current = null;
    limpiaIndicadores();
    touchRef.current = { id: null, targetId: null };
  }, [onReordenar, capturePositions, limpiaIndicadores]);

  // ===================================================================
  // BOTÓN ⬆️
  // ===================================================================
  const handleMoverArriba = useCallback(
    (id) => {
      capturePositions();
      shouldAnimate.current = true;
      onMoverArriba(id);
    },
    [onMoverArriba, capturePositions]
  );

  return (
    <div className="column">
      <div className="column-header green">
        <span>✅ Disponibles</span>
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
              : '✨ No hay pickers disponibles.<br />Agrega uno arriba.'
            }
          </p>
        ) : (
          <ul className="picker-list" ref={listRef}>
            {filteredItems.map((picker, index) => {
              const isDragging = picker.id === dragRef.current;
              return (
                <li
                  key={picker.id}
                  className={`picker-item entering turno-${picker.turno || 'am'}${isDragging ? ' dragging' : ''}`}
                  draggable
                  data-id={picker.id}
                  data-index={index}
                  onDragStart={(e) => handleDragStart(e, picker.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, picker.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, picker.id)}
                >
                  <span className="drag-handle" aria-label="Arrastrar para reordenar"
                    onTouchStart={(e) => handleTouchStart(e, picker.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    ⠿
                  </span>
                  <span className="name">{picker.nombre}</span>
                  <span className="pedidos-count" title="Pedidos completados hoy">
                    {picker.pedidos_completados || 0} ✅
                  </span>
                  <div className="actions">
                    {index > 0 && onMoverArriba && (
                      <button
                        className="btn btn-up btn-sm"
                        onClick={() => handleMoverArriba(picker.id)}
                        title="Mover al inicio"
                      >
                        ⬆️
                      </button>
                    )}
                    {picker.disponible_push && onLiberarPicker && (
                      <button
                        className="btn btn-liberar btn-sm"
                        onClick={() => onLiberarPicker(picker.id)}
                        title="Liberar picker (desactivar notificaciones)"
                      >
                        🔓
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onSacarFuera(picker.id)}
                      title="Sacar del turno"
                    >
                      ⏸️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
