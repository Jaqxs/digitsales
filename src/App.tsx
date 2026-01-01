import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DataLoader } from "@/components/DataLoader";
import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SystemLogs from "./pages/SystemLogs";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">The application encountered an unexpected error. This might be due to a database connection issue.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  console.log("App: Rendering");
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <LayoutProvider>
                <DataLoader />
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
                  <Route path="/system-logs" element={<ProtectedRoute allowedRoles={['admin']}><SystemLogs /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </LayoutProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
