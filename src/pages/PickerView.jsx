import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePickers } from '../hooks/usePickers';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const STORAGE_SELECTED = 'gestorPickerSelected';

export default function PickerView() {
  const { toasts, addToast } = useToast();

  const [selectedId, setSelectedId] = useState(() =>
    localStorage.getItem(STORAGE_SELECTED)
  );

  const {
    pickers,
    disponibles,
    loading,
    toggleDisponiblePush,
  } = usePickers(supabase, null);

  const {
    supported,
    permission,
    subscribed,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications();
  const [pushStatus, setPushStatus] = useState('idle');

  // Suscribir/desuscribir automáticamente al cambiar disponible_push
  useEffect(() => {
    if (!selectedId) return;

    const picker = pickers.find((p) => p.id === selectedId);
    if (!picker) return;

    const isAvailable = picker.disponible_push;

    if (isAvailable && !subscribed && pushStatus === 'idle') {
      setPushStatus('subscribing');
      subscribe(selectedId).finally(() => setPushStatus('idle'));
    }

    if (!isAvailable && subscribed && pushStatus === 'idle') {
      setPushStatus('unsubscribing');
      unsubscribe(selectedId).finally(() => setPushStatus('idle'));
    }
  }, [selectedId, pickers, subscribed]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_SELECTED, id);
  }, []);

  const handleUnlink = useCallback(async () => {
    if (subscribed) {
      await unsubscribe(selectedId);
      toggleDisponiblePush(selectedId);
    }
    setSelectedId(null);
    localStorage.removeItem(STORAGE_SELECTED);
  }, [selectedId, subscribed, unsubscribe, toggleDisponiblePush]);

  const handleToggleAvailable = useCallback(async (id) => {
    // Solo pedir permiso si está activando notificaciones
    const picker = pickers.find((p) => p.id === id);
    const turningOn = picker && !picker.disponible_push;

    if (turningOn && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        addToast?.('🔕 Permiso de notificaciones denegado. Actívalo desde la configuración del navegador.', 'error');
        return;
      }
    }
    toggleDisponiblePush(id);
  }, [pickers, permission, requestPermission, toggleDisponiblePush, addToast]);

  const selectedPicker = pickers.find((p) => p.id === selectedId);
  const isAvailable = selectedPicker?.disponible_push ?? false;

  // Posición del picker en la lista de disponibles
  const miPosicion = disponibles.findIndex((p) => p.id === selectedId);

  const getStatusInfo = () => {
    if (!selectedPicker) return null;
    if (selectedPicker.fuera) return { label: 'Fuera del turno', color: 'var(--orange)', emoji: '⏸️' };
    if (selectedPicker.estado === 'pedido') return { label: 'En pedido', color: 'var(--blue)', emoji: '📦' };
    return { label: 'Disponible', color: 'var(--green)', emoji: '✅' };
  };

  if (loading) {
    return (
      <div className="login-loading">
        <span>🔄</span>
        <p>Cargando pickers...</p>
      </div>
    );
  }

  // ============================================================
  // ESTADO: NO HAY PICKER SELECCIONADO
  // ============================================================
  if (!selectedId || !selectedPicker) {
    return (
      <div className="picker-page">
        <div className="picker-header">
          <span className="picker-header-icon">🔔</span>
          <h1>Modo Picker</h1>
          <p>Selecciona tu nombre para comenzar</p>
        </div>

        {pickers.length === 0 ? (
          <div className="picker-empty">
            <p>No hay pickers registrados aún.</p>
            <p className="picker-hint">
              El coordinador debe agregar pickers desde el panel de administración.
            </p>
            <Link to="/" className="btn btn-outline">
              🔑 Ir al panel del coordinador
            </Link>
          </div>
        ) : (
          <div className="picker-selector-grid">
            {pickers.map((p) => {
              const enUso = p.disponible_push;
              return (
                <button
                  key={p.id}
                  className={`picker-select-card${enUso ? ' picker-select-card--ocupado' : ''}`}
                  onClick={() => !enUso && handleSelect(p.id)}
                  disabled={enUso}
                  title={enUso ? '🚫 Este picker ya está siendo usado en otro dispositivo' : `Seleccionar ${p.nombre}`}
                >
                  <span className="picker-select-name">
                    {enUso ? '🔒 ' : '👤 '}{p.nombre}
                  </span>
                  <span className="picker-select-status">
                    {enUso
                      ? '🔒 En uso'
                      : p.fuera
                      ? '⏸️ Fuera'
                      : p.estado === 'pedido'
                      ? '📦 En pedido'
                      : '✅ Disponible'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="picker-back-link">
          <Link to="/" className="btn btn-outline">🔑 Acceso coordinador</Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // ESTADO: PICKER SELECCIONADO
  // ============================================================
  const status = getStatusInfo();
  const isBusy = pushStatus !== 'idle';

  return (
    <div className="picker-page">
      <div className="picker-header">
        <span className="picker-header-icon">🔔</span>
        <h1>Modo Picker</h1>
      </div>

      <div className="picker-profile-card">
        <div className="picker-profile-name">
          👤 {selectedPicker.nombre}
        </div>

        <div className="picker-profile-status">
          <span
            className="picker-status-dot"
            style={{ backgroundColor: status?.color }}
          />
          <span>{status?.emoji} {status?.label}</span>
        </div>

        {/* Posición en la cola */}
        {miPosicion !== -1 && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '12px', fontWeight: 500 }}>
            {miPosicion === 0
              ? '✅ ¡Eres el próximo!'
              : `👥 ${miPosicion} picker${miPosicion !== 1 ? 's' : ''} antes que tú`}
          </p>
        )}

        {/* Toggle Disponible / No disponible */}
        <div className="picker-toggle-section">
          <p className="picker-toggle-label">
            {isAvailable
              ? '🟢 Disponible — te llegarán notificaciones'
              : '🔴 No disponible — no recibirás notificaciones'}
          </p>
          <button
            className={`picker-toggle-btn ${isAvailable ? 'on' : 'off'}`}
            onClick={() => handleToggleAvailable(selectedPicker.id)}
            disabled={isBusy}
          >
            <span className="picker-toggle-knob" />
            <span className="picker-toggle-text">
              {isBusy
                ? (pushStatus === 'subscribing' ? 'Activando…' : 'Desactivando…')
                : (isAvailable ? 'Disponible' : 'No disponible')}
            </span>
          </button>
        </div>

        {/* Estado de notificaciones push */}
        {!supported && (
          <p className="picker-push-warning">
            ⚠️ Tu navegador no soporta notificaciones push.
            Usa Chrome o Edge en tu celular.
          </p>
        )}
        {supported && permission === 'default' && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  addToast?.('✅ Permiso concedido. Activa "Disponible" para recibir notificaciones.', 'success');
                } else {
                  addToast?.('💡 Permiso denegado. Puedes activarlo desde la configuración del navegador.', 'error');
                }
              }}
            >
              🔔 Activar notificaciones
            </button>
          </div>
        )}
        {supported && permission === 'denied' && (
          <div className="picker-push-warning" style={{ marginTop: '16px', padding: '14px', lineHeight: '1.7' }}>
            <strong>🔕 Notificaciones bloqueadas</strong>
            <br />
            1. <span style={{ background: '#e5e7eb', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>🔒</span> Toca el candado en la barra de direcciones
            <br />
            2. Ve a <strong>Configuración del sitio</strong>
            <br />
            3. Cambia <strong>Notificaciones</strong> a <strong>Permitir</strong>
            <br />
            4. Recarga la página y vuelve a activar "Disponible"
            <br />
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
              onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  addToast?.('✅ Permiso concedido', 'success');
                }
              }}
            >
              🔄 Re-intentar
            </button>
          </div>
        )}
        {supported && isAvailable && subscribed && (
          <p className="picker-push-ok">✅ Notificaciones activas</p>
        )}
        {supported && !isAvailable && (
          <p className="picker-push-muted">🔇 Notificaciones silenciadas</p>
        )}
      </div>

      <button
        className="btn btn-outline picker-unlink-btn"
        onClick={handleUnlink}
      >
        🔄 Cambiar de picker
      </button>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
