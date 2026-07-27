import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary mb-2">
        Dashboard
      </h1>
      <p className="text-tertiary mb-8">Bienvenido a RaCo CMS</p>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Colecciones', value: '0', icon: LayoutDashboard },
          { label: 'Entradas', value: '0', icon: LayoutDashboard },
          { label: 'Templates', value: '0', icon: LayoutDashboard },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-tertiary/20 p-6"
          >
            <p className="text-tertiary text-sm mb-1">{label}</p>
            <p className="font-heading text-3xl font-bold text-primary">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
