import React, {
  useState,
  createContext,
  useContext,
} from "react";
import { LoginPage } from "./components/LoginPage";
import { AgentDashboard } from "./components/AgentDashboard";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";

interface User {
  id: string;
  username: string;
  role: "Admin" | "Branch Manager" | "Agent";
  branchId?: string;
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string,
    role: string,
  ) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // Mock authentication - in real app this would call API
  const login = (
    username: string,
    password: string,
    role: string,
  ): boolean => {
    // Mock validation
    if (username && password && role) {
      const mockUser: User = {
        id: `user_${Date.now()}`,
        username,
        role: role as "Admin" | "Branch Manager" | "Agent",
        branchId: role === "Admin" ? undefined : "branch_001",
        employeeId: `emp_${Date.now()}`,
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

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
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="min-h-screen bg-gray-50">
        {!user ? <LoginPage /> : renderDashboard()}
      </div>
    </AuthContext.Provider>
  );
}