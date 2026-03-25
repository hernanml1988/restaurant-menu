import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, ShieldCheck } from 'lucide-react';
import logo from '@/assets/restaurant-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const roleLabels = {
  admin: 'Administracion',
  kitchen: 'Cocina',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useRestaurantProfile();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromPath = (location.state as LocationState | null)?.from?.pathname;

  const redirectAfterLogin = (role: 'admin' | 'kitchen') => {
    if (fromPath) {
      navigate(fromPath, { replace: true });
      return;
    }

    navigate(role === 'admin' ? '/admin' : '/cocina', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (fromPath) {
        navigate(fromPath, { replace: true });
        return;
      }

      navigate(user.role === 'admin' ? '/admin' : '/cocina', { replace: true });
    }
  }, [isAuthenticated, user, fromPath, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await login({ email, password });

    if (!result.ok) {
      setErrorMessage(result.message);
      setIsSubmitting(false);
      return;
    }

    redirectAfterLogin(result.role);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--secondary))_0%,_transparent_42%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(32_22%_94%)_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
        <section className="flex-1 animate-slide-up py-10 lg:py-0">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="max-w-xl">
            <img
              src={profile.logoDataUrl || logo}
              alt={profile.name}
              className="mb-6 h-20 w-20 rounded-[1.75rem] object-cover shadow-sm"
            />
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-primary">
              Acceso interno
            </p>
            <h1 className="font-display text-5xl leading-tight text-foreground md:text-6xl">
              Cocina y administracion en un unico acceso.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Protegemos los modulos operativos sin tocar la experiencia publica del cliente.
              Inicia sesion y te llevamos directo al panel que te corresponde.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-border/80 bg-card/80 p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Ingreso protegido</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  La vista publica sigue abierta. Solo cocina y administracion requieren sesion.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-border/80 bg-card/80 p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <ChefHat className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Redireccion por rol</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Un mismo formulario distribuye el acceso a cocina o administracion.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl animate-slide-up rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Iniciar sesion</p>
              <h2 className="font-display text-3xl">Acceso a modulos internos</h2>
            </div>
            <div className="rounded-2xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
              Backend real
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo interno
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@empresa.com"
                className="h-12 rounded-xl border-border/80 bg-background/80"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contrasena
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contrasena"
                className="h-12 rounded-xl border-border/80 bg-background/80"
                autoComplete="current-password"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-8 rounded-[1.5rem] bg-muted/70 p-5">
            <p className="text-sm font-semibold text-foreground">Acceso conectado al backend</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Este formulario ahora usa `POST /auth/login` y mantiene la sesion con cookies HTTP-only.
              Inicia con una cuenta registrada en la API y te redirigimos segun el rol recibido.
            </p>
            <div className="mt-4 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
              Roles compatibles: {roleLabels.admin} y {roleLabels.kitchen}.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
