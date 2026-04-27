import React, { useState } from "react";
import { Copy, Gift, LogOut, Package, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CustomerPortal() {
  const [cpf, setCpf] = useState("");
  const [customer, setCustomer] = useState<{name: string, points: number, cashback: number} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error("Por favor, digite um CPF válido.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "public_balances", cleanCpf);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCustomer(docSnap.data() as any);
        toast.success("Dados encontrados!");
      } else {
        toast.error("CPF não encontrado em nossa base.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (customer) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col p-4">
        {/* Header */}
        <header className="flex justify-between items-center py-4 mb-4">
          <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-10 object-contain" />
          <Button variant="ghost" onClick={() => setCustomer(null)} className="text-white/70 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </header>

        <main className="flex-1 max-w-md w-full mx-auto space-y-6 pt-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Olá, {customer.name}!</h1>
            <p className="text-white/60">Bem-vindo(a) à sua área exclusiva.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">{customer.points}</h3>
                <p className="text-xs text-white/70 tracking-widest uppercase">Pontos</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-green-400">R$ {customer.cashback.toFixed(2)}</h3>
                <p className="text-xs text-green-400/70 tracking-widest uppercase">Cashback</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary text-primary-foreground border-none mt-8 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Package className="w-24 h-24" />
             </div>
             <CardContent className="p-6 relative z-10">
               <h3 className="text-xl font-bold mb-2">Quero usar meus pontos</h3>
               <p className="text-sm opacity-90 mb-4">
                 Acumule mais pontos para trocar por prêmios e descontos em suas próximas compras.
               </p>
               <Button className="w-full bg-white text-primary hover:bg-neutral-100">
                 Resgatar Benefícios
               </Button>
             </CardContent>
          </Card>
        </main>
        
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-md">
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="mx-auto h-16 object-contain" />
            <h1 className="text-2xl font-bold text-white">Área do Cliente</h1>
            <p className="text-sm text-white/70">Acompanhe seus pontos e cashback</p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">Digite seu CPF</label>
              <Input 
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
                placeholder="000.000.000-00"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30 h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? "Buscando..." : "Consultar Meus Pontos"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
