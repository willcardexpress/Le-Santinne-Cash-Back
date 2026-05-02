import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { Copy, CreditCard, LayoutDashboard, Settings, Users, LogOut, Gift, Bell, Menu, X, Trophy } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Pages
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import SettingsPage from "./pages/SettingsPage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        const isPasswordUser = usr.providerData.some(p => p.providerId === 'password');
        const allowedEmails = ["funilsites@gmail.com", "estudiokasar@gmail.com"];
        const allowedUids = ["pZ14BRaUndVhBGUH3iTXZMBLHm", "pZ14BRaUndVhBGUH3iTXZMBLHmS2", "bDFXkFV9YKPmVrroTqBJVvnhnNy1"];
        
        const isAdmin = isPasswordUser || (usr.email && allowedEmails.includes(usr.email)) || allowedUids.includes(usr.uid);
        
        if (!isAdmin) {
          await auth.signOut();
          setUser(null);
          return;
        }
        setUser(usr);
      } else {
        setUser(null);
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const allowedEmails = ["funilsites@gmail.com", "estudiokasar@gmail.com"];
      const allowedUids = ["pZ14BRaUndVhBGUH3iTXZMBLHm", "pZ14BRaUndVhBGUH3iTXZMBLHmS2", "bDFXkFV9YKPmVrroTqBJVvnhnNy1"];
      const isAllowed = (result.user.email && allowedEmails.includes(result.user.email)) || allowedUids.includes(result.user.uid);
      
      if (!isAllowed) {
        await auth.signOut();
        toast.error("Acesso negado", { description: "Somente o administrador listado pode acessar." });
        return;
      }
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error("Google Login Desativado", { description: "Você precisa ativar o provedor 'Google' no menu Authentication do Firebase." });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error("Domínio não autorizado", { description: "Adicione 'lesantinnecashback.vercel.app' nos domínios autorizados do Firebase Auth." });
      } else {
        toast.error("Erro no login", { description: `Erro: ${error.message}` });
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth provider listener will set the user
    } catch (error: any) {
      console.error("Login com email falhou", error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error("E-mail/Senha Desativado", { description: "Ative o provedor 'E-mail/Senha' no Firebase Console -> Authentication." });
      } else if (error.code === 'auth/invalid-credential') {
         toast.error("Credenciais inválidas", { description: "A senha ou o e-mail não conferem." });
      } else if (error.code === 'auth/user-not-found') {
        toast.error("Usuário não encontrado", { description: "Este e-mail não está cadastrado no Firebase." });
      } else {
        toast.error("Erro no login", { description: `Erro: ${error.message}` });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary mx-auto rounded-full flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Programa de Fidelidade</h1>
        <p className="text-neutral-500 mt-2">Acesso ao Administrador</p>
      </div>
      
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md border border-neutral-100">
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div className="space-y-2 text-left">
            <Label htmlFor="email">E-mail Administrativo</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="admin@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Entrando..." : "Entrar com Email"}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-50 px-2 text-neutral-500">ou</span>
          </div>
        </div>

        <Button onClick={handleGoogleLogin} variant="outline" size="lg" className="w-full">
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/customers" },
  { icon: Trophy, label: "Votação", path: "/polls" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
  };

  const sidebarContent = (
    <>
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
              onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full shadow-2xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-20 bg-white border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-10 object-contain" />
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
            <p className="text-xs text-muted-foreground tracking-wide">Bem-vindo à gestão do seu Programa de Fidelidade</p>
          </div>
          <div className="flex space-x-2 md:space-x-4">
            <Button variant="outline" className="hidden sm:flex text-xs font-medium border-border" onClick={() => navigate("/settings")}>Configurar</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-lg shadow-primary/20" onClick={() => {
              navigate("/customers");
              toast.info("Acesse a página de Clientes e clique em EXTRATO para realizar um resgate.");
            }}>Novo Resgate</Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

import CustomerPortal from "./pages/CustomerPortal";

import AdminPolls from "./pages/AdminPolls";
import Voting from "./pages/Voting";
import PerfumeQuiz from "./pages/PerfumeQuiz";

import CashbackSignup from "./pages/CashbackSignup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/me" element={<CustomerPortal />} />
        <Route path="/votar" element={<Voting />} />
        <Route path="/quiz" element={<PerfumeQuiz />} />
        <Route path="/cashback" element={<CashbackSignup />} />
        <Route path="/*" element={
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/polls" element={<AdminPolls />} />
              </Routes>
            </Layout>
          </AuthProvider>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

