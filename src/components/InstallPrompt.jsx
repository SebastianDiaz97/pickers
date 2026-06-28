import { useState, useEffect } from 'react';

/**
 * Botón flotante "📲 Instalar aplicación" que:
 * - Se oculta hasta que el navegador dispare beforeinstallprompt
 * - Al pulsarlo, muestra el diálogo oficial de instalación
 * - Se oculta una vez instalada la app
 * - No se muestra si ya está en modo standalone (ya instalada)
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    // Escuchar cambios de tamaño de pantalla
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkSize);

    // Si ya está instalada (modo standalone), no mostrar el botón
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return () => window.removeEventListener('resize', checkSize);
    }

    const handleBeforeInstall = (e) => {
      // Prevenir que Chrome muestre su banner automático
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    const handleAppInstalled = () => {
      setShow(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostrar el diálogo de instalación
    deferredPrompt.prompt();

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;

    // Limpiar el evento (solo se puede usar una vez)
    setDeferredPrompt(null);

    // Ocultar el botón solo si instaló, si canceló no volverá a aparecer
    // porque el evento beforeinstallprompt no se dispara两次
    if (outcome === 'accepted') {
      setShow(false);
    }
  };

  if (!show || !isMobile) return null;

  return (
    <button
      className="install-prompt-btn"
      onClick={handleInstall}
      title="Instalar esta aplicación en tu dispositivo"
    >
      <span className="install-prompt-icon">📲</span>
      <span className="install-prompt-text">Instalar aplicación</span>
    </button>
  );
}
