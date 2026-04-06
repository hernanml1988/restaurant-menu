import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import LoginPage from './pages/auth/LoginPage';

import ClientLayout from './pages/client/ClientLayout';
import ClientWelcome from './pages/client/ClientWelcome';
import ClientMenu from './pages/client/ClientMenu';
import ClientProductDetail from './pages/client/ClientProductDetail';
import ClientCart from './pages/client/ClientCart';
import ClientConfirmation from './pages/client/ClientConfirmation';
import ClientTracking from './pages/client/ClientTracking';
import ClientCallWaiter from './pages/client/ClientCallWaiter';

import KitchenDashboard from './pages/kitchen/KitchenDashboard';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTables from './pages/admin/AdminTables';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminMyData from './pages/admin/AdminMyData';
import AdminReservations from './pages/admin/AdminReservations';
import AdminOperations from './pages/admin/AdminOperations';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/cliente" element={<ClientLayout />}>
                <Route path="bienvenida" element={<ClientWelcome />} />
                <Route path="menu" element={<ClientMenu />} />
                <Route path="producto/:id" element={<ClientProductDetail />} />
                <Route path="carrito" element={<ClientCart />} />
                <Route path="confirmacion" element={<ClientConfirmation />} />
                <Route path="seguimiento" element={<ClientTracking />} />
                <Route path="ayuda" element={<ClientCallWaiter />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['kitchen']} />}>
                <Route path="/cocina" element={<KitchenDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="mesas" element={<AdminTables />} />
                  <Route path="menu" element={<AdminMenuPage />} />
                  <Route path="pedidos" element={<AdminOrders />} />
                  <Route path="usuarios" element={<AdminUsers />} />
                  <Route path="reportes" element={<AdminReports />} />
                  <Route path="reservas" element={<AdminReservations />} />
                  <Route path="operaciones" element={<AdminOperations />} />
                  <Route path="mis-datos" element={<AdminMyData />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
