import { useState, useCallback, useRef } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const addToast = useCallback((mensaje, tipo = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, mensaje, tipo, exiting: false }]);

    // Auto-remove after 2.5s
    timersRef.current[id] = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timersRef.current[id];
      }, 250);
    }, 2500);
  }, []);

  return { toasts, addToast };
}
