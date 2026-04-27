import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Coins, ArrowUpRight, Target, ExternalLink, Play } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activePoints: 0,
    generatedCashback: 0,
    redeemCount: 0
  });
  const [recentResgates, setRecentResgates] = useState<any[]>([]);

  useEffect(() => {
    const qCust = query(collection(db, "customers"));
    const unsubCust = onSnapshot(qCust, (snapshot) => {
      let activePoints = 0;
      let generatedCashback = 0;
      snapshot.docs.forEach(doc => {
         const data = doc.data();
         activePoints += data.pointsBalance || 0;
         generatedCashback += data.cashbackBalance || 0;
      });
      setStats(prev => ({ ...prev, totalCustomers: snapshot.size, activePoints, generatedCashback }));
    });

    const qTrans = query(collection(db, "transactions"));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
        let redeems = 0;
        const resgates = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if(data.type === "redeem_cashback" || data.type === "redeem_points") {
                redeems++;
                resgates.push({ id: doc.id, ...data });
            }
        });
        setStats(prev => ({ ...prev, redeemCount: redeems }));
        setRecentResgates(resgates.sort((a,b) => b.createdAt - a.createdAt).slice(0, 4));
    });

    return () => {
      unsubCust();
      unsubTrans();
    };
  }, []);

  const simulateBlingPurchase = async () => {
    toast.info("Simulando webhook do Bling...");
    
    // Simulate a random purchase
    const amount = Math.floor(Math.random() * 500) + 50; 
    let customerId = "simulated_customer";
    
    try {
        // Fetch current settings
        const { getDoc } = await import("firebase/firestore");
        const settingsDoc = await getDoc(doc(db, "settings", "store"));
        const settingsData = settingsDoc.data();
        const pointsPerCurrency = settingsData?.pointsPerCurrency || 1;
        const cashbackPercent = settingsData?.cashbackPercent || 5;
        const pointsThreshold = settingsData?.pointsThreshold || 150;
        
        const points = amount * pointsPerCurrency;
        const cashback = amount * (cashbackPercent / 100);

        // Fetch customer to check previous balance
        const customerDoc = await getDoc(doc(db, "customers", customerId));
        const previousPoints = customerDoc.exists() ? (customerDoc.data().pointsBalance || 0) : 0;
        const previousCashback = customerDoc.exists() ? (customerDoc.data().cashbackBalance || 0) : 0;
        const newPoints = previousPoints + points;

        await setDoc(doc(db, "customers", customerId), {
            name: customerDoc.exists() ? customerDoc.data().name : "Cliente Exemplo " + Math.floor(Math.random() * 100),
            email: "cliente@exemplo.com",
            phone: "11999999999",
            cpf: "12345678900",
            pointsBalance: newPoints,
            cashbackBalance: increment(cashback),
            createdAt: customerDoc.exists() ? customerDoc.data().createdAt : Date.now(),
            updatedAt: Date.now()
        }, { merge: true });

        const customerName = customerDoc.exists() ? customerDoc.data().name : "Cliente Exemplo";
        // Update public balance
        if (customerDoc.exists() && customerDoc.data().cpf) {
           await setDoc(doc(db, "public_balances", customerDoc.data().cpf.replace(/\D/g, '')), {
             name: customerDoc.data().name,
             points: newPoints,
             cashback: previousCashback + cashback,
             updatedAt: Date.now()
           });
        }

        await addDoc(collection(db, "transactions"), {
            customerId,
            type: "earn_cashback",
            amount: cashback,
            source: "bling_webhook_sim",
            description: `Compra simulada de R$ ${amount}`,
            createdAt: Date.now()
        });

        const pointsMessageTemplate = settingsData?.pointsMessage || "Olá {nome}, obrigado por seu Pedido #{numero_pedido}! Você comprou:\n{produtos_com_valores}\n\nValor total: R$ {valor_total}. Você ganhou {pontos} pontos! Seu saldo atual é {saldo} pontos.";
        const productsList = [
            { name: "Produto 1", price: amount * 0.4 },
            { name: "Serviço Master", price: amount * 0.6 }
        ];
        const formatProducts = productsList.map(p => `- ${p.name} (R$ ${p.price.toFixed(2)})`).join('\n');
        const orderNumber = Math.floor(Math.random() * 90000) + 10000;
        
        const message = pointsMessageTemplate
            .replace("{nome}", customerName)
            .replace("{produtos_com_valores}", formatProducts)
            .replace("{valor_total}", amount.toFixed(2))
            .replace("{numero_pedido}", orderNumber.toString())
            .replace("{pontos}", points.toString())
            .replace("{saldo}", newPoints.toString());

        toast.success(`Venda #${orderNumber} simulada! R$ ${amount.toFixed(2)}. ${points} pts e R$ ${cashback.toFixed(2)} gerados.`);
        toast("Mensagem de Compra enviada", { description: message, icon: "💬" });

        // Check threshold crossing
        const previousMultiples = Math.floor(previousPoints / pointsThreshold);
        const newMultiples = Math.floor(newPoints / pointsThreshold);
        if (newMultiples > previousMultiples) {
             toast("Meta de Pontos Alcançada!", { 
               description: `Mensagem enviada oferecendo desconto na loja (Chegou a ${newPoints} pts, ultrapassou os ${pointsThreshold}).`,
               icon: "🎉",
               duration: 8000
             });
        }

    } catch (error) {
        toast.error("Erro na simulação.");
        console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
          <p className="text-xs text-muted-foreground tracking-wide">Visão geral do seu programa de fidelidade.</p>
        </div>
        <Button onClick={simulateBlingPurchase} variant="outline" className="border-border text-xs font-medium">
          <Play className="w-3 h-3 mr-2 text-primary" />
          Simular Venda ERP
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total de Clientes</p>
          <p className="text-2xl font-light text-foreground">{stats.totalCustomers}</p>
        </div>
        
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Pontos Ativos</p>
          <p className="text-2xl font-light text-foreground">{stats.activePoints}</p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Cashback Gerado</p>
          <p className="text-2xl font-light text-foreground">R$ {stats.generatedCashback.toFixed(2)}</p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Resgates Realizados</p>
          <p className="text-2xl font-light text-foreground">{stats.redeemCount}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Últimos Resgates</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">Tempo Real</span>
          </div>
          <div className="flex-1 p-0 flex flex-col">
            {recentResgates.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm flex-1 flex items-center justify-center">Nenhum resgate recente.</div>
            ) : (
              recentResgates.map((r, i) => (
                <div key={i} className={`p-6 border-b border-neutral-100 flex items-center justify-between ${i % 2 === 0 ? 'bg-transparent' : 'bg-neutral-50/50'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">ID Cliente: {r.customerId.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground italic">
                        {r.description || `Resgate de ${r.amount}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-500">-{r.amount} pts/R$</p>
                    <span className="text-[10px] text-green-600 font-bold uppercase">Aprovado</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-sidebar rounded-xl shadow-xl p-6 text-sidebar-foreground flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Integração Bling</h3>
            
            <div className="space-y-6">
              <div className="relative pl-6 border-l border-white/20">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-green-400"></div>
                <p className="text-[10px] text-green-400 mb-1 font-mono">Status</p>
                <p className="text-xs opacity-80 leading-relaxed text-white">Aguardando Webhooks. O sistema já está pronto para receber webhooks do Bling em tempo real.</p>
              </div>
              <div className="relative pl-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Monitorando canais...</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <Link to="/settings" className={buttonVariants({ variant: "outline", className: "w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" })}>
                Ver Configurações <ExternalLink className="w-3 h-3 ml-2"/>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
