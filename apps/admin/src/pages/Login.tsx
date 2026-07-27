import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo-fondo-blanco.png';

export default function Login() {
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (token) return <Navigate to="/" />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Credenciales incorrectas');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white rounded-2xl shadow-sm border border-tertiary/20 p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="RaCo CMS" className="w-32 h-32" />
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-secondary text-white rounded-md font-medium hover:bg-secondary/90 transition-colors"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
