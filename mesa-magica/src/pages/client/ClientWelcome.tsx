import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, MapPin, Receipt } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useApp } from '@/context/AppContext';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';
import { startDiningSessionRequest } from '@/services/diningSessionService';
import logo from '@/assets/restaurant-logo.png';

export default function ClientWelcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useRestaurantProfile();
  const { session, setSession } = useApp();

  const qrCode = searchParams.get('qr')?.trim() || session?.table?.qrCode || '';
  const existingSessionToken =
    session?.table?.qrCode === qrCode ? session.sessionToken : undefined;

  const sessionQuery = useQuery({
    queryKey: ['client', 'session', qrCode, existingSessionToken],
    queryFn: () =>
      startDiningSessionRequest({
        qrCode,
        existingSessionToken,
      }),
    enabled: Boolean(qrCode),
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setSession(sessionQuery.data);
    }
  }, [sessionQuery.data]);

  const activeSession = sessionQuery.data ?? session;
  const tableName = activeSession?.table?.name ?? 'Mesa no determinada';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-scale-in mb-6">
        <img
          src={profile.logoDataUrl || logo}
          alt={profile.name}
          className="w-24 h-24 mx-auto rounded-3xl shadow-lg object-cover"
        />
      </div>

      <h1 className="font-display text-3xl tracking-tight mb-1 animate-slide-up">
        {profile.name}
      </h1>
      <p className="text-muted-foreground mb-6 animate-slide-up delay-100">
        {profile.tagline}
      </p>

      {sessionQuery.isLoading && (
        <div className="animate-slide-up delay-200 bg-primary/8 border border-primary/20 rounded-2xl px-6 py-4 mb-8">
          <p className="text-sm text-muted-foreground">
            Preparando tu mesa y abriendo tu sesión...
          </p>
        </div>
      )}

      {!qrCode && !activeSession && (
        <Alert className="mb-8 max-w-md text-left">
          <AlertTitle>QR requerido</AlertTitle>
          <AlertDescription>
            Escanea el código QR de tu mesa para iniciar la experiencia del cliente.
          </AlertDescription>
        </Alert>
      )}

      {sessionQuery.error && (
        <Alert className="mb-8 max-w-md text-left border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo abrir la mesa</AlertTitle>
          <AlertDescription>
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : 'Verifica el QR e intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      )}

      {activeSession && (
        <>
          <div className="animate-slide-up delay-200 bg-primary/8 border border-primary/20 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Estás en</p>
              <p className="font-semibold text-lg">{tableName}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-8 max-w-xs animate-slide-up delay-300">
            Explora nuestro menú, personaliza tu pedido y sigue el estado de tu cuenta en tiempo real.
          </p>

          <button
            onClick={() => navigate('/cliente/menu')}
            className="animate-slide-up delay-400 w-full max-w-xs bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97]"
          >
            Ver menú
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex gap-3 mt-6 animate-slide-up delay-500">
            <button
              onClick={() => navigate('/cliente/ayuda')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
            >
              <Bell className="w-4 h-4" />
              Llamar mesero
            </button>
            <button
              onClick={() => navigate('/cliente/ayuda')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
            >
              <Receipt className="w-4 h-4" />
              Pedir cuenta
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-12">
            Sesión: {activeSession.sessionToken} · Expira al cerrar cuenta
          </p>
        </>
      )}
    </div>
  );
}
