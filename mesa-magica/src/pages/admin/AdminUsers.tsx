import { Shield, Edit, UserPlus, UserCheck, UserX } from 'lucide-react';
import { users } from '@/data/mockData';

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-primary/10 text-primary' },
  supervisor: { label: 'Supervisor', color: 'bg-accent/10 text-accent' },
  cocina: { label: 'Cocina', color: 'bg-status-pending/10 text-status-pending' },
  cajero: { label: 'Cajero', color: 'bg-status-preparing/10 text-status-preparing' },
  mesero: { label: 'Mesero', color: 'bg-secondary text-secondary-foreground' },
};

export default function AdminUsers() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Usuarios</h1>
          <p className="text-muted-foreground">{users.length} usuarios registrados</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97]">
          <UserPlus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rol</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estado</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const role = roleConfig[user.role];
              return (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{user.avatar}</div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${role.color}`}>
                      <Shield className="w-3 h-3" /> {role.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-accent text-xs font-medium"><UserCheck className="w-3 h-3" /> Activo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium"><UserX className="w-3 h-3" /> Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-muted active:scale-[0.95]">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
