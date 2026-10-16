// Mensaje centrado a pantalla completa (404, sitio sin página de inicio...)
export default function Notice({ code, title, text, link }: { code?: string; title: string; text: string; link?: boolean }) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {code && <p className="font-heading text-7xl font-bold text-secondary">{code}</p>}
      <h1 className="mt-4 font-heading text-2xl font-bold md:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md opacity-75">{text}</p>
      {link && (
        <a href="/" className="mt-8 rounded-md bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90">
          Volver al inicio
        </a>
      )}
    </section>
  );
}
