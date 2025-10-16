import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { AgentDashboard } from "./components/AgentDashboard";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "Agent":
        return <AgentDashboard />;
      case "Branch Manager":
        return <ManagerDashboard />;
      case "Admin":
        return <AdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!user ? <LoginPage /> : renderDashboard()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}