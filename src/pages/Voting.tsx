import React, { useState, useEffect } from "react";
import { collection, doc, addDoc, setDoc, getDoc, onSnapshot, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Gift, CheckCircle2, ChevronRight, Hash, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function Voting() {
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pollResults, setPollResults] = useState<any>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pollIdParam = searchParams.get("id");

    if (pollIdParam) {
      if (localStorage.getItem(`hasVoted_${pollIdParam}`) === "true") {
        setHasVoted(true);
      }
      const unsub = onSnapshot(doc(db, "polls", pollIdParam), (docSnap) => {
        if (docSnap.exists() && docSnap.data().active) {
          setPoll({ id: docSnap.id, ...docSnap.data() as any });
        } else {
          setPoll(null);
        }
        setLoading(false);
      });
      return () => unsub();
    } else {
      const q = query(collection(db, "polls"), where("active", "==", true));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
          docs.sort((a, b) => b.createdAt - a.createdAt);
          const activePoll = docs[0];
          
          if (localStorage.getItem(`hasVoted_${activePoll.id}`) === "true") {
            setHasVoted(true);
          }
          setPoll(activePoll);
        } else {
          setPoll(null);
        }
        setLoading(false);
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (!poll || !poll.active) return;
    
    // Live results for public page (optional, but requested by prompt to show votes)
    const votesQuery = query(collection(db, "votes"), where("pollId", "==", poll.id));
    const unsubVotes = onSnapshot(votesQuery, (snapshot) => {
      const results: any = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        results[data.productId] = (results[data.productId] || 0) + 1;
      });
      setPollResults(results);
    });
    
    return () => unsubVotes();
  }, [poll]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro!");
      return;
    }
    if (!name.trim()) {
      toast.error("Digite seu nome.");
      return;
    }
    if (phone.length < 10) {
      toast.error("Digite um telefone válido.");
      return;
    }

    setSubmitting(true);
    try {
      // Fetch user IP
      let userIp = "unknown";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        userIp = ipData.ip;
      } catch (err) {
        console.warn("Could not fetch IP", err);
      }

      // 1. Check Phone
      try {
        await setDoc(doc(db, "vote_checks", `poll_${poll.id}_phone_${phone}`), { 
          timestamp: Date.now(),
          pollId: poll.id,
          productId: selectedProduct,
          customerPhone: phone,
          customerName: name,
          ipAddress: userIp
        });
      } catch (err: any) {
        toast.error("Este número de WhatsApp já votou nesta promoção!");
        setSubmitting(false);
        return;
      }

      // 2. Check IP
      if (userIp !== "unknown") {
        const safeIp = userIp.replace(/\./g, '_').replace(/:/g, '_');
        try {
          await setDoc(doc(db, "vote_checks", `poll_${poll.id}_ip_${safeIp}`), { 
            timestamp: Date.now(),
            pollId: poll.id,
            productId: selectedProduct,
            customerPhone: phone,
            customerName: name,
            ipAddress: userIp
          });
        } catch (err: any) {
          toast.error("Já foi registrado um voto a partir desta rede/aparelho.");
          // Only blocking on IP might be harsh, but keeping as requested
        }
      }

      await addDoc(collection(db, "votes"), {
        pollId: poll.id,
        productId: selectedProduct,
        customerName: name,
        customerPhone: phone,
        createdAt: Date.now()
      });
      
      localStorage.setItem(`hasVoted_${poll.id}`, "true");
      setHasVoted(true);
      toast.success("Voto computado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao registrar voto", { description: "Tente novamente mais tarde." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="animate-pulse flex items-center gap-2"><Gift className="text-primary w-6 h-6 animate-spin"/> Carregando...</div></div>;
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mb-6">
          <Gift className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Nenhuma votação ativa</h1>
        <p className="text-neutral-500 max-w-sm">No momento não temos nenhuma votação promocional acontecendo. Fique de olho em nossas redes sociais!</p>
      </div>
    );
  }

  // Calculate total votes for percentages
  const totalVotes = Object.values(pollResults).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-10 object-contain brightness-0" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{poll.title || "Qual produto deve entrar na promoção?"}</h1>
          <p className="text-lg text-neutral-600 max-w-xl mx-auto">Vote no seu favorito! O produto vencedor entrará em oferta exclusiva.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 text-sm font-medium text-neutral-700 bg-white inline-flex px-6 py-3 rounded-full border border-neutral-200 shadow-sm">
             {poll.endDate && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-neutral-400" /> Votação Encerra: <strong className="text-neutral-900">{poll.endDate.split('-').reverse().join('/')}</strong></span>}
             {poll.endDate && poll.promoDate && <span className="hidden sm:inline text-neutral-300">•</span>}
             {poll.promoDate && <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" /> Promoção inicia: <strong className="text-primary">{poll.promoDate.split('-').reverse().join('/')}</strong></span>}
          </div>
        </div>

        <AnimatePresence mode="wait">
            <motion.div 
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden"
            >
              <div className="p-6 md:p-8">
                
                  <div className="flex flex-col gap-3 mb-8">
                    {poll.products?.map((p: any) => {
                      const isSelected = selectedProduct === p.id;
                      const votes = pollResults[p.id] || 0;
                      const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      
                      return (
                        <div 
                          key={p.id}
                          onClick={() => !hasVoted && setSelectedProduct(p.id)}
                          className={`relative rounded-2xl p-3 border transition-all duration-300 flex items-center group overflow-hidden ${
                            hasVoted ? 'cursor-default border-neutral-200' : 'cursor-pointer hover:border-primary/50 hover:bg-neutral-50'
                          } ${
                            isSelected && !hasVoted
                              ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' 
                              : ''
                          }`}
                        >
                          {hasVoted && (
                            <div className="absolute inset-0 z-0 bg-neutral-50/50">
                               <div className="bg-primary/10 h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                            </div>
                          )}
                          
                          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 relative rounded-xl overflow-hidden mr-4 bg-white border border-neutral-100 z-10">
                            <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center text-left pr-8 z-10">
                            <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-2 line-clamp-2 leading-tight">{p.name}</h3>
                            
                            {hasVoted && (
                              <div className="text-xs sm:text-sm font-medium text-neutral-500 flex justify-between items-center bg-white p-2 rounded-lg border border-neutral-100 w-auto inline-flex gap-4 shadow-sm mt-3">
                                 <span>⭐ {votes} votos</span>
                                 <span className="text-primary font-bold">{percent}%</span>
                              </div>
                            )}
                          </div>

                          {isSelected && !hasVoted && (
                            <div className="absolute top-1/2 -translate-y-1/2 right-4 bg-primary text-white rounded-full p-1 z-10 shadow-sm">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!hasVoted ? (
                    <form onSubmit={handleVote} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex flex-col gap-4">
                      <Label className="text-base font-semibold text-neutral-900 block">Confirme seu voto para finalizar!</Label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                          id="name"
                          type="text"
                          placeholder="Seu Nome Completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-14 text-base rounded-xl border-neutral-300 focus-visible:ring-primary bg-white flex-1"
                          required
                        />
                        <div className="relative flex-1">
                          <Input 
                            id="phone"
                            type="tel"
                            placeholder="WhatsApp (Ex: 11999999999)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            className="pl-12 h-14 text-base rounded-xl border-neutral-300 focus-visible:ring-primary bg-white w-full"
                            required
                          />
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        size="lg" 
                        disabled={submitting || !selectedProduct}
                        className="h-14 w-full text-lg rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                      >
                        {submitting ? "Registrando..." : "Votar Agora!"}
                        {!submitting && <ChevronRight className="ml-2 w-5 h-5" />}
                      </Button>
                      {!selectedProduct && (
                        <p className="text-amber-600 text-sm mt-1 font-medium text-center">
                          👆 Selecione um produto acima para votar
                        </p>
                      )}
                    </form>
                  ) : (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 rounded-2xl p-6 md:p-8 border border-green-100 text-center relative overflow-hidden"
                    >
                       <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                       <h3 className="text-2xl font-bold text-green-800 mb-2">Voto Registrado com Sucesso!</h3>
                       <p className="text-green-700 text-lg">Obrigado por participar. Acompanhe os resultados parciais dessa votação ao vivo logo acima.</p>
                    </motion.div>
                  )}
                  
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
