import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute routeName="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute routeName="pos"><PointOfSale /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute routeName="inventory"><Inventory /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute routeName="sales"><Sales /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute routeName="customers"><Customers /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute routeName="employees"><Employees /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute routeName="reports"><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute routeName="settings"><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
