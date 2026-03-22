import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Client
import ClientLayout from "./pages/client/ClientLayout";
import ClientWelcome from "./pages/client/ClientWelcome";
import ClientMenu from "./pages/client/ClientMenu";
import ClientProductDetail from "./pages/client/ClientProductDetail";
import ClientCart from "./pages/client/ClientCart";
import ClientConfirmation from "./pages/client/ClientConfirmation";
import ClientTracking from "./pages/client/ClientTracking";
import ClientCallWaiter from "./pages/client/ClientCallWaiter";

// Kitchen
import KitchenDashboard from "./pages/kitchen/KitchenDashboard";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTables from "./pages/admin/AdminTables";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Client mobile */}
            <Route path="/cliente" element={<ClientLayout />}>
              <Route path="bienvenida" element={<ClientWelcome />} />
              <Route path="menu" element={<ClientMenu />} />
              <Route path="producto/:id" element={<ClientProductDetail />} />
              <Route path="carrito" element={<ClientCart />} />
              <Route path="confirmacion" element={<ClientConfirmation />} />
              <Route path="seguimiento" element={<ClientTracking />} />
              <Route path="ayuda" element={<ClientCallWaiter />} />
            </Route>

            {/* Kitchen */}
            <Route path="/cocina" element={<KitchenDashboard />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="mesas" element={<AdminTables />} />
              <Route path="menu" element={<AdminMenuPage />} />
              <Route path="pedidos" element={<AdminOrders />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="reportes" element={<AdminReports />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
