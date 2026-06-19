import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePickers } from '../hooks/usePickers';
import { useToast } from '../hooks/useToast';
import Header from '../components/Header';
import Stats from '../components/Stats';
import AddPickerForm from '../components/AddPickerForm';
import DisponiblesColumn from '../components/DisponiblesColumn';
import PedidoColumn from '../components/PedidoColumn';
import FueraSection from '../components/FueraSection';
import ToastContainer from '../components/ToastContainer';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard({ user, onLogout }) {
  const { toasts, addToast } = useToast();
  const [showConfirmTurno, setShowConfirmTurno] = useState(false);
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false);
  const [eliminarPickerId, setEliminarPickerId] = useState(null);
  const [showConfirmFinalizar, setShowConfirmFinalizar] = useState(false);
  const [finalizarPickerId, setFinalizarPickerId] = useState(null);

  const {
    pickers,
    disponibles,
    enPedido,
    fuera,
    agregarPicker,
    asignarPedido,
    finalizarPedido,
    sacarFuera,
    restaurarPicker,
    restaurarTodos,
    eliminarFuera,
    reordenarDisponibles,
    liberarPicker,
    nuevoTurno,
    loading,
    error,
  } = usePickers(supabase, addToast);

  // Cleanup animation classes after they finish (solo para picker items, no toasts)
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.classList.contains('picker-item')) return;
      if (e.target.classList.contains('entering')) {
        e.target.classList.remove('entering');
      }
      if (e.target.classList.contains('exiting')) {
        e.target.remove();
      }
    };
    document.addEventListener('animationend', handler);
    return () => document.removeEventListener('animationend', handler);
  }, []);

  const dispList = disponibles;
  const pedidoList = enPedido;
  const fueraList = fuera;

  const handleAdd = (nombre, turno) => agregarPicker(nombre, turno);
  const handleAssign = () => asignarPedido();
  const handleFinalizar = (id) => {
    setFinalizarPickerId(id);
    setShowConfirmFinalizar(true);
  };
  const handleSacarFuera = (id) => sacarFuera(id);
  const handleRestaurar = (id) => restaurarPicker(id);
  const handleEliminar = (id) => {
    setEliminarPickerId(id);
    setShowConfirmEliminar(true);
  };
  const handleConfirmEliminar = () => {
    if (eliminarPickerId) {
      eliminarFuera(eliminarPickerId);
      setEliminarPickerId(null);
    }
    setShowConfirmEliminar(false);
  };

  const handleConfirmFinalizar = (completado) => {
    if (finalizarPickerId) {
      finalizarPedido(finalizarPickerId, completado);
      setFinalizarPickerId(null);
    }
    setShowConfirmFinalizar(false);
  };

  const handleRestaurarTodos = () => restaurarTodos();
  const handleNuevoTurno = () => setShowConfirmTurno(true);
  const handleConfirmNuevoTurno = () => {
    setShowConfirmTurno(false);
    nuevoTurno();
  };
  const handleReordenar = (sourceId, targetId) =>
    reordenarDisponibles(sourceId, targetId);

  const handleMoverArriba = (id) => {
    const first = dispList[0];
    if (first && first.id !== id) {
      reordenarDisponibles(id, first.id, 'before');
    }
  };

  // Mostrar error de conexión si falló Supabase
  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error, addToast]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '2rem' }}>🔄</div>
        <div style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Conectando con Supabase...
        </div>
      </div>
    );
  }

  return (
    <>
      <Header onNuevoTurno={handleNuevoTurno} onLogout={onLogout} user={user} />

      <Stats disponibles={dispList} enPedido={pedidoList} fuera={fueraList} />

      <AddPickerForm
        onAdd={handleAdd}
        onAssign={handleAssign}
        disponiblesCount={dispList.length}
      />

      <div className="botones-leyenda">
        <span><span className="leyenda-color am"></span> AM</span>
        <span><span className="leyenda-color pm"></span> PM</span>
        <span>⬆️ Mover inicio</span>
        <span>🔓 Liberar notificaciones</span>
        <span>⏸️ Sacar turno</span>
        <span>⠿ Arrastrar</span>
      </div>

          <div className="columns">
        <DisponiblesColumn
          items={dispList}
          onSacarFuera={handleSacarFuera}
          onReordenar={handleReordenar}
          onMoverArriba={handleMoverArriba}
          onLiberarPicker={liberarPicker}
        />
        <PedidoColumn items={pedidoList} onFinalizar={handleFinalizar} />
      </div>

      <FueraSection
        items={fueraList}
        onRestaurar={handleRestaurar}
        onEliminar={handleEliminar}
        onRestaurarTodos={handleRestaurarTodos}
      />

      <ConfirmModal
        open={showConfirmTurno}
        title="🗑️ ¿Iniciar nuevo turno?"
        message="Se eliminarán todos los pickers de la lista. Esta acción no se puede deshacer."
        confirmLabel="Sí, iniciar nuevo turno"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmNuevoTurno}
        onCancel={() => setShowConfirmTurno(false)}
      />

      <ConfirmModal
        open={showConfirmEliminar}
        title="🗑️ Eliminar picker"
        message={`¿Eliminar a "${pickers.find((p) => p.id === eliminarPickerId)?.nombre || ''}" del turno permanentemente? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmEliminar}
        onCancel={() => {
          setShowConfirmEliminar(false);
          setEliminarPickerId(null);
        }}
      />

      {showConfirmFinalizar && (
        <div className="modal-overlay" onClick={() => setShowConfirmFinalizar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✅ Finalizar pedido</h3>
            <p className="modal-message">
              ¿El pedido de <strong>{pickers.find((p) => p.id === finalizarPickerId)?.nombre || ''}</strong> se completó?
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-success"
                onClick={() => handleConfirmFinalizar(true)}
                autoFocus
              >
                ✅ Sí, completado
              </button>
              <button
                className="btn btn-outline"
                onClick={() => handleConfirmFinalizar(false)}
              >
                ❌ No, cancelado
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}
