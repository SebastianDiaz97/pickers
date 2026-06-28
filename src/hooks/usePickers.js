import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { generarId } from '../utils/helpers';

const STORAGE_KEY = 'gestorPickers';

function cargarEstadoLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.pickers && Array.isArray(data.pickers)) {
      return {
        pickers: data.pickers,
        fueraIds: new Set(data.fueraIds || []),
      };
    }
    return null;
  } catch (e) {
    console.warn('No se pudo cargar desde localStorage:', e);
    return null;
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabaseClient
 * @param {Function} addToast
 */
export function usePickers(supabaseClient, addToast) {
  const cargado = cargarEstadoLocal();
  const [pickers, setPickers] = useState(cargado?.pickers || []);
  const [fueraIds, setFueraIds] = useState(cargado?.fueraIds || new Set());
  const [loading, setLoading] = useState(!!supabaseClient);
  const [error, setError] = useState(null);

  // Ref para evitar mostrar notificaciones de nuestros propios cambios
  const isLocalMutation = useRef(false);
  const mutationTimeoutRef = useRef(null);
  // Ref para suprimir toasts de DELETE durante nuevoTurno (evita N-1 toasts "undefined")
  const suppressDeleteToasts = useRef(false);

  // ===================================================================
  // CARGA INICIAL DESDE SUPABASE
  // ===================================================================
  useEffect(() => {
    if (!supabaseClient) return;

    let mounted = true;

    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error: err } = await supabaseClient
          .from('pickers')
          .select('*')
          .order('orden', { ascending: true });

        if (err) throw err;

        if (mounted && data) {
          const nuevosFueraIds = new Set(
            data.filter((row) => row.fuera).map((row) => row.id)
          );

          setPickers(
            data.map((row) => ({
              id: row.id,
              nombre: row.nombre,
              estado: row.estado,
              fuera: row.fuera || false,
              orden: row.orden || 0,
              disponible_push: row.disponible_push ?? false,
              pedidos_completados: row.pedidos_completados ?? 0,
              turno: row.turno || 'am',
            }))
          );
          setFueraIds(nuevosFueraIds);
          setError(null);
        }
      } catch (err) {
        console.error('Error cargando desde Supabase:', err);
        setError('No se pudo conectar con Supabase. Usando datos locales.');
        const local = cargarEstadoLocal();
        if (local) {
          setPickers(local.pickers);
          setFueraIds(local.fueraIds);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadFromSupabase();

    return () => {
      mounted = false;
    };
  }, [supabaseClient]);

  // ===================================================================
  // SUSCRIPCIÓN A CAMBIOS EN TIEMPO REAL
  // ===================================================================
  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel('pickers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pickers' },
        (payload) => {
          // Si el cambio lo hicimos nosotros (dentano del timeout de seguridad), lo ignoramos
          if (isLocalMutation.current) {
            clearTimeout(mutationTimeoutRef.current);
            isLocalMutation.current = false;
            return;
          }

          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT' && newRow) {
            setPickers((prev) => [
              ...prev,
              {
                id: newRow.id,
                nombre: newRow.nombre,
                estado: newRow.estado,
                fuera: newRow.fuera || false,
                orden: newRow.orden || 0,
                disponible_push: newRow.disponible_push ?? false,
                pedidos_completados: newRow.pedidos_completados ?? 0,
                turno: newRow.turno || 'am',
              },
            ]);
            if (newRow.fuera) {
              setFueraIds((prev) => new Set(prev).add(newRow.id));
            }
            addToast?.(`🆕 "${newRow.nombre}" agregado a Disponibles`, 'info');
          }

          if (eventType === 'UPDATE' && newRow) {
            setPickers((prev) =>
              prev.map((p) =>
                p.id === newRow.id
                  ? {
                      ...p,
                      nombre: newRow.nombre,
                      estado: newRow.estado,
                      fuera: newRow.fuera || false,
                      orden: newRow.orden || 0,
                      disponible_push: newRow.disponible_push ?? false,
                      pedidos_completados: newRow.pedidos_completados ?? 0,
                      turno: newRow.turno || 'am',
                    }
                  : p
              )
            );

            if (newRow.fuera) {
              setFueraIds((prev) => new Set(prev).add(newRow.id));
            } else {
              setFueraIds((prev) => {
                const next = new Set(prev);
                next.delete(newRow.id);
                return next;
              });
            }

            // Toast según el tipo de cambio
            if (newRow.estado === 'pedido') {
              addToast?.(`📋 "${newRow.nombre}" recibió un pedido`, 'info');
            } else if (newRow.fuera && !oldRow?.fuera) {
              addToast?.(`⏸️ "${newRow.nombre}" está fuera del turno`, 'info');
            } else if (!newRow.fuera && oldRow?.fuera) {
              addToast?.(`🔄 "${newRow.nombre}" regresó al turno`, 'success');
            } else if (
              newRow.estado === 'disponible' &&
              oldRow?.estado === 'pedido'
            ) {
              addToast?.(
                `✅ "${newRow.nombre}" finalizó su pedido`,
                'success'
              );
            }
          }

          if (eventType === 'DELETE') {
            setPickers((prev) => prev.filter((p) => p.id !== oldRow?.id));
            if (oldRow?.id) {
              setFueraIds((prev) => {
                const next = new Set(prev);
                next.delete(oldRow.id);
                return next;
              });
            }
            if (!suppressDeleteToasts.current) {
              addToast?.(`🗑️ "${oldRow?.nombre}" eliminado del turno`, 'error');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
      clearTimeout(mutationTimeoutRef.current);
    };
  }, [supabaseClient, addToast]);

  // ===================================================================
  // GUARDAR EN LOCALSTORAGE (respaldo offline)
  // ===================================================================
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pickers, fueraIds: Array.from(fueraIds) })
      );
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }, [pickers, fueraIds]);

  // ===================================================================
  // SINCRONIZAR CON SUPABASE
  // ===================================================================
  async function syncToSupabase(operation) {
    if (!supabaseClient) return;
    try {
      clearTimeout(mutationTimeoutRef.current);
      isLocalMutation.current = true;
      await operation();
      // Safety net: si el evento Realtime no vuelve, reseteamos después de 3s
      mutationTimeoutRef.current = setTimeout(() => {
        isLocalMutation.current = false;
      }, 3000);
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
      isLocalMutation.current = false;
    }
  }

  // ===================================================================
  // ESTADO COMPUTADO
  // ===================================================================
  const disponibles = useMemo(
    () =>
      pickers
        .filter((p) => p.estado === 'disponible' && !fueraIds.has(p.id))
        .sort((a, b) => a.orden - b.orden),
    [pickers, fueraIds]
  );

  const enPedido = useMemo(
    () => pickers.filter((p) => p.estado === 'pedido'),
    [pickers]
  );

  const fuera = useMemo(
    () => pickers.filter((p) => fueraIds.has(p.id)),
    [pickers, fueraIds]
  );

  // ===================================================================
  // ACCIONES
  // ===================================================================
  const agregarPicker = useCallback(
    (nombre, turno = 'am') => {
      const nombreTrim = nombre.trim();
      if (!nombreTrim) return false;

      const existe = pickers.some(
        (p) =>
          p.nombre.toLowerCase() === nombreTrim.toLowerCase() &&
          !fueraIds.has(p.id)
      );
      if (existe) {
        addToast?.(`"${nombreTrim}" ya está en la lista`, 'error');
        return false;
      }

      const maxOrden = Math.max(...pickers.map((p) => p.orden || 0), 0);
      const nuevo = {
        id: generarId(),
        nombre: nombreTrim,
        estado: 'disponible',
        fuera: false,
        orden: maxOrden + 1,
        disponible_push: false,
        pedidos_completados: 0,
        turno,
      };

      setPickers((prev) => [...prev, nuevo]);
      addToast?.(`"${nombreTrim}" agregado a Disponibles`, 'success');

      syncToSupabase(async () => {
        const { error: err } = await supabaseClient
          .from('pickers')            .insert({
            id: nuevo.id,
            nombre: nuevo.nombre,
            estado: nuevo.estado,
            fuera: false,
            orden: nuevo.orden,
            disponible_push: false,
            turno,
          });
        if (err) throw err;
      });

      return true;
    },
    [pickers, fueraIds, supabaseClient, addToast]
  );

  const asignarPedido = useCallback(() => {
    if (disponibles.length === 0) {
      addToast?.('No hay pickers disponibles para asignar', 'error');
      return;
    }

    const picker = disponibles[0];

    setPickers((prev) =>
      prev.map((p) => (p.id === picker.id ? { ...p, estado: 'pedido' } : p))
    );
    setFueraIds((prev) => {
      const next = new Set(prev);
      next.delete(picker.id);
      return next;
    });
    addToast?.(`📋 Pedido asignado a "${picker.nombre}"`, 'info');

    syncToSupabase(async () => {
      const { error: err } = await supabaseClient
        .from('pickers')
        .update({ estado: 'pedido', fuera: false })
        .eq('id', picker.id);
      if (err) throw err;

      // Enviar notificación push al picker si tiene suscripción activa
      if (picker.disponible_push) {
        try {
          const { data: subs } = await supabaseClient
            .from('push_subscriptions')
            .select('subscription')
            .eq('picker_id', picker.id)
            .maybeSingle();

          if (subs?.subscription) {
            await supabaseClient.functions.invoke('send-push', {
              body: {
                subscription: subs.subscription,
                title: '📋 Nuevo pedido asignado',
                body: `${picker.nombre}, tienes un nuevo pedido.`,
                url: '/picker',
              },
            });
          }
        } catch (pushErr) {
          console.warn('Error sending push notification:', pushErr);
        }
      }
    });
  }, [disponibles, supabaseClient, addToast]);

  const finalizarPedido = useCallback(
    (id, completado = true) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      // Calcular el orden correcto ANTES de mutar el estado local
      const targetOrden = Math.max(...pickers.map((p) => p.orden || 0), 0) + 1;
      const nuevosCompletados = completado
        ? (picker.pedidos_completados || 0) + 1
        : picker.pedidos_completados || 0;

      setPickers((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;
        const p = {
          ...prev[idx],
          estado: 'disponible',
          orden: targetOrden,
          pedidos_completados: nuevosCompletados,
        };
        const next = [...prev];
        next.splice(idx, 1);
        next.push(p);
        return next;
      });

      if (completado) {
        addToast?.(
          `✅ "${picker.nombre}" completó el pedido (${nuevosCompletados} hoy)`,
          'success'
        );
      } else {
        addToast?.(`"${picker.nombre}" volvió a Disponibles (pedido cancelado)`, 'info');
      }

      syncToSupabase(async () => {
        const updates = {
          estado: 'disponible',
          orden: targetOrden,
        };
        if (completado) {
          updates.pedidos_completados = nuevosCompletados;
        }
        const { error: err } = await supabaseClient
          .from('pickers')
          .update(updates)
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient, addToast]
  );

  const sacarFuera = useCallback(
    (id) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      setFueraIds((prev) => new Set(prev).add(id));
      addToast?.(`"${picker.nombre}" está fuera del turno ⏸️`, 'info');

      syncToSupabase(async () => {
        const { error: err } = await supabaseClient
          .from('pickers')
          .update({ fuera: true })
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient, addToast]
  );

  const restaurarPicker = useCallback(
    (id) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      setFueraIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Mantener el orden original — solo actualizar fuera: false in-place
      setPickers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, fuera: false } : p))
      );

      addToast?.(`"${picker.nombre}" restaurado al turno`, 'success');

      syncToSupabase(async () => {
        const { error: err } = await supabaseClient
          .from('pickers')
          .update({ fuera: false })
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient, addToast]
  );

  const restaurarTodos = useCallback(() => {
    const lista = fuera;
    if (lista.length === 0) {
      addToast?.('No hay pickers fuera del turno', 'info');
      return;
    }

    setFueraIds(new Set());
    // Mantener el orden original — solo actualizar fuera: false in-place
    setPickers((prev) => {
      const ids = new Set(lista.map((p) => p.id));
      return prev.map((p) => (ids.has(p.id) ? { ...p, fuera: false } : p));
    });

    addToast?.(
      `🔄 ${lista.length} picker${lista.length > 1 ? 's' : ''} restaurado${lista.length > 1 ? 's' : ''}`,
      'success'
    );

    syncToSupabase(async () => {
      await Promise.all(
        lista.map((p) =>
          supabaseClient
            .from('pickers')
            .update({ fuera: false })
            .eq('id', p.id)
        )
      );
    });
  }, [fuera, supabaseClient, addToast]);

  const toggleDisponiblePush = useCallback(
    (id) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      const nuevoValor = !picker.disponible_push;

      setPickers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, disponible_push: nuevoValor } : p
        )
      );

      syncToSupabase(async () => {
        const { error: err } = await supabaseClient
          .from('pickers')
          .update({ disponible_push: nuevoValor })
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient]
  );

  const eliminarFuera = useCallback(
    (id) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      setPickers((prev) => prev.filter((p) => p.id !== id));
      setFueraIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      addToast?.(`"${picker.nombre}" eliminado del turno 🗑️`, 'error');

      syncToSupabase(async () => {
        const { error: err } = await supabaseClient
          .from('pickers')
          .delete()
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient, addToast]
  );

  // ===================================================================
  // FUNCIÓN COMPARTIDA: Reordenar lista de disponibles
  // ===================================================================
  const reordenarLista = useCallback(
    (sourceId, targetId, pos) => {
      const dsp = [...disponibles];
      const srcIdx = dsp.findIndex((p) => p.id === sourceId);
      const tgtIdx = dsp.findIndex((p) => p.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return null;

      const [p] = dsp.splice(srcIdx, 1);
      let insertIdx = dsp.findIndex((mp) => mp.id === targetId);
      if (pos === 'after' && insertIdx < dsp.length) {
        insertIdx += 1;
      }
      dsp.splice(insertIdx, 0, p);

      return dsp.map((mp, i) => ({ ...mp, orden: i + 1 }));
    },
    [disponibles]
  );

  const reordenarDisponibles = useCallback(
    (sourceId, targetId, pos = 'before') => {
      const reordenados = reordenarLista(sourceId, targetId, pos);
      if (!reordenados) return;

      setPickers((prev) => {
        const movedIds = new Set(reordenados.map((mp) => mp.id));
        const noRelevant = prev.filter((mp) => !movedIds.has(mp.id));
        return [...reordenados, ...noRelevant];
      });

      syncToSupabase(async () => {
        await Promise.all(
          reordenados.map((mp) =>
            supabaseClient
              .from('pickers')
              .update({ orden: mp.orden })
              .eq('id', mp.id)
          )
        );
      });
    },
    [reordenarLista, supabaseClient]
  );

  const liberarPicker = useCallback(
    (id) => {
      const picker = pickers.find((p) => p.id === id);
      if (!picker) return;

      // Solo liberar si realmente tiene disponible_push activo
      if (!picker.disponible_push) {
        addToast?.(`"${picker.nombre}" ya está liberado`, 'info');
        return;
      }

      setPickers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, disponible_push: false } : p
        )
      );
      addToast?.(`🔓 "${picker.nombre}" liberado — notificaciones desactivadas`, 'success');

      syncToSupabase(async () => {
        // Limpiar suscripción push en Supabase
        await supabaseClient
          .from('push_subscriptions')
          .delete()
          .eq('picker_id', id);

        // Actualizar disponible_push a false
        const { error: err } = await supabaseClient
          .from('pickers')
          .update({ disponible_push: false })
          .eq('id', id);
        if (err) throw err;
      });
    },
    [pickers, supabaseClient, addToast]
  );

  const nuevoTurno = useCallback(() => {
    setPickers([]);
    setFueraIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
    addToast?.('🗑️ Nuevo turno iniciado. Lista limpia.', 'info');

    // Suprimir toasts de DELETE para evitar N-1 notificaciones de "undefined"
    suppressDeleteToasts.current = true;

    syncToSupabase(async () => {
      // Limpiar todas las suscripciones push
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .neq('picker_id', '');

      // Limpiar todos los pickers
      const { error: err } = await supabaseClient
        .from('pickers')
        .delete()
        .neq('id', 'none');
      if (err) throw err;

      // Reactivar toasts de DELETE solo si la operación fue exitosa
      // y dar tiempo a que lleguen todos los eventos Realtime
      setTimeout(() => {
        suppressDeleteToasts.current = false;
      }, 3000);
    });
  }, [supabaseClient, addToast]);

  return {
    pickers,
    disponibles,
    enPedido,
    fuera,
    loading,
    error,
    agregarPicker,
    asignarPedido,
    finalizarPedido,
    sacarFuera,
    restaurarPicker,
    restaurarTodos,
    toggleDisponiblePush,
    eliminarFuera,
    reordenarDisponibles,
    liberarPicker,
    nuevoTurno,
  };
}
