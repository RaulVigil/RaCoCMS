import logo from '../assets/logo-fondo-blanco.png';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white rounded-2xl shadow-sm border border-tertiary/20 p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="RaCo CMS" className="w-32 h-32" />
        </div>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            className="w-full px-4 py-2.5 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full px-4 py-2.5 rounded-md border border-tertiary/30 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
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
