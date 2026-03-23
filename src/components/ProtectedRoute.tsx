import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChefHat, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { type InternalModuleRole } from '@/data/internalAuth';

interface ProtectedRouteProps {
  allowedRoles: InternalModuleRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm animate-scale-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ChefHat className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl">Verificando acceso</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Estamos preparando tu sesion interna.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 shadow-sm animate-scale-in">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl">Acceso restringido</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Tu sesion esta activa, pero no tienes permisos para abrir este modulo.
          </p>
          <div className="mt-6 rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
            Iniciaste sesion como <span className="font-semibold text-foreground">{user.fullName}</span>.
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
