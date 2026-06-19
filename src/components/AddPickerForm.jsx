import React, { useState } from 'react';

export default function AddPickerForm({ onAdd, onAssign, disponiblesCount }) {
  const [nombre, setNombre] = useState('');
  const [turno, setTurno] = useState(() => localStorage.getItem('turno') || 'am');

  const handleTurnoChange = (e) => {
    const val = e.target.value;
    setTurno(val);
    localStorage.setItem('turno', val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim()) {
      onAdd(nombre.trim(), turno);
      setNombre('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onAssign();
    }
  };

  return (
    <form className="add-form" onSubmit={handleSubmit} autoComplete="off">
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nombre del picker, ej: Juan Pérez"
        required
        autoFocus
      />
      <select
        className="turno-select"
        value={turno}
        onChange={handleTurnoChange}
        title="Seleccionar turno"
      >
        <option value="am">☀️ AM</option>
        <option value="pm">🌆 PM</option>
      </select>
      <button type="submit" className="btn btn-primary">
        ➕ Agregar
      </button>
      <button
        type="button"
        className="btn btn-assign"
        disabled={disponiblesCount === 0}
        onClick={onAssign}
      >
        📋 Asignar Pedido
      </button>
    </form>
  );
}
