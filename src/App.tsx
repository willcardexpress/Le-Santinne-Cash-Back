import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./firebase";
import { Copy, CreditCard, LayoutDashboard, Settings, Users, LogOut, Gift, Bell } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Pages
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import SettingsPage from "./pages/SettingsPage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (usr && usr.email !== "funilsites@gmail.com") {
        await auth.signOut();
        setUser(null);
      } else {
        setUser(usr);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>;

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== "funilsites@gmail.com") {
        await auth.signOut();
        toast.error("Acesso negado", { description: "Somente o administrador pode acessar este sistema." });
        return;
      }
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Erro no login", { description: "Não foi possível realizar o login." });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary mx-auto rounded-full flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Programa de Fidelidade</h1>
        <p className="text-neutral-500 mt-2">Sistema de Pontos e Cashback</p>
      </div>
      <Button onClick={handleLogin} size="lg" className="w-full max-w-sm">
        Entrar com Google
      </Button>
    </div>
  );
}

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/customers" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
        <div className="p-8">
          <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-12 object-contain mb-2" />
          <p className="text-[10px] opacity-50 tracking-widest mt-1">FIDELIDADE & CASHBACK</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${isActive ? 'border-2 border-primary' : 'border border-white/40 rounded-full'}`}>
                  {isActive && <Icon className="w-3 h-3 text-primary" />}
                </div>
                <span className={`text-sm ${isActive ? '' : 'opacity-70'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-6">
             <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold">
               B
             </div>
             <div>
               <p className="text-xs font-bold text-white">Bling ERP</p>
               <p className="text-[10px] text-green-400">Conectado</p>
             </div>
          </div>

          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="w-9 h-9 border border-white/20">
              <AvatarImage src={auth.currentUser?.photoURL || ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">{auth.currentUser?.displayName?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {auth.currentUser?.displayName || "Adminuração"}
              </p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-white/50 hover:text-white/90 hover:bg-white/5" onClick={handleLogout}>
            <LogOut className="mr-2 w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-20 bg-white border-b border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-12 object-contain" />
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
            <p className="text-xs text-muted-foreground tracking-wide">Bem-vindo à gestão do seu Programa de Fidelidade</p>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" className="hidden sm:flex text-xs font-medium border-border" onClick={() => navigate("/settings")}>Configurar Loja Física</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-lg shadow-primary/20" onClick={() => {
              navigate("/customers");
              toast.info("Acesse a página de Clientes e clique em EXTRATO para realizar um resgate.");
            }}>Novo Resgate</Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

import CustomerPortal from "./pages/CustomerPortal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/me" element={<CustomerPortal />} />
        <Route path="/*" element={
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </AuthProvider>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

