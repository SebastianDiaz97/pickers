import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ onLogin, loginError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    await onLogin(email.trim(), password);
    setSubmitting(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🛒</span>
          <h1>Gestor de Pickers</h1>
          <p>Acceso del coordinador</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coordinator@ejemplo.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {loginError && (
            <div className="login-error">
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={submitting}
          >
            {submitting ? 'Iniciando sesión…' : '🔑 Iniciar sesión'}
          </button>
        </form>

        <p className="login-hint">
          Crea un usuario en Supabase Auth (sección Authentication &gt; Users &gt; Add User)
          con el email y contraseña del coordinador.
        </p>

        <div className="login-divider" />

        <p className="login-picker-link">
          ¿Eres un picker?{' '}
          <Link to="/picker">Ingresa aquí sin contraseña →</Link>
        </p>
      </div>
    </div>
  );
}
