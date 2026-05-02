import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Copy, Plus, Vibrate, CheckCircle2, Search, Trash2, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function AdminPolls() {
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [pollResults, setPollResults] = useState<any>({});
  const [votersList, setVotersList] = useState<any>({});
  const [pollPages, setPollPages] = useState<Record<string, number>>({});
  
  const [endDate, setEndDate] = useState("");
  const [promoDate, setPromoDate] = useState("");
  const [pollTitle, setPollTitle] = useState("Qual produto deve entrar na próxima promoção?");

  // Mock Bling Search
  const searchBling = () => {
    if (!searchTerm) return;
    const newProduct = {
      id: `bling_${Math.floor(Math.random() * 10000)}`,
      name: searchTerm,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
    };
    setSelectedProducts([...selectedProducts, newProduct]);
    setSearchTerm("");
    toast.success("Produto adicionado da Bling");
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      p.sort((a, b) => b.createdAt - a.createdAt);
      setPolls(p);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const activePolls = polls.filter(p => p.active);
    if (activePolls.length === 0) return;
    
    // Listen to all votes to aggregate results (simplified for demo)
    const unsubVotes = onSnapshot(collection(db, "votes"), (snapshot) => {
      const results: any = {};
      const voters: any = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!results[data.pollId]) results[data.pollId] = {};
        results[data.pollId][data.productId] = (results[data.pollId][data.productId] || 0) + 1;
        
        if (!voters[data.pollId]) voters[data.pollId] = [];
        voters[data.pollId].push(data);
      });
      setPollResults(results);
      setVotersList(voters);
    });
    
    return () => unsubVotes();
  }, [polls]);

  const startPoll = async () => {
    if (selectedProducts.length < 2) {
      toast.error("Adicione pelo menos 2 produtos para a votação.");
      return;
    }
    if (!endDate || !promoDate) {
      toast.error("Preencha a data de encerramento e a data da promoção.");
      return;
    }
    
    try {
      await addDoc(collection(db, "polls"), {
        active: true,
        title: pollTitle,
        endDate: endDate,
        promoDate: promoDate,
        products: selectedProducts,
        createdAt: Date.now()
      });
      toast.success("Votação iniciada com sucesso!");
      setSelectedProducts([]);
      setEndDate("");
      setPromoDate("");
      setPollTitle("Qual produto deve entrar na próxima promoção?");
    } catch (err: any) {
      toast.error("Erro ao iniciar", { description: err.message });
    }
  };

  const stopPoll = async (pollId: string) => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        active: false
      });
      toast.success("Votação encerrada.");
    } catch (err: any) {
      toast.error("Erro ao encerrar", { description: err.message });
    }
  };

  if (loading) return <div>Carregando...</div>;

  const activePolls = polls.filter(p => p.active);
  const inactivePolls = polls.filter(p => !p.active);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Votação de Promoção</h2>
          <p className="text-neutral-500 text-sm mt-1">Configure opções para os clientes votarem e acompanhe o resultado</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Nova Votação</CardTitle>
          <CardDescription>Configure uma nova votação e busque produtos para adicionar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Título da Votação</Label>
               <Input 
                 value={pollTitle}
                 onChange={e => setPollTitle(e.target.value)}
                 placeholder="Ex: Qual produto entra na promoção?"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Encerra em</Label>
                 <Input 
                   type="date"
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Promoção inicia</Label>
                 <Input 
                   type="date"
                   value={promoDate}
                   onChange={e => setPromoDate(e.target.value)}
                 />
               </div>
             </div>
          </div>

          <div className="space-y-2">
            <Label>Adicionar Produtos (Busca Bling)</Label>
            <div className="flex space-x-2">
              <Input 
                placeholder="Buscar produto pelo nome ou SKU (Simulação Bling)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchBling()}
              />
              <Button onClick={searchBling} type="button">
                <Search className="w-4 h-4 mr-2" /> Buscar
              </Button>
            </div>
          </div>
          
          {selectedProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-neutral-600">Produtos Selecionados ({selectedProducts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedProducts.map((p, i) => (
                  <div key={i} className="flex border border-neutral-200 rounded-xl overflow-hidden relative">
                    <img src={p.imageUrl} className="w-20 h-20 object-cover" alt="" />
                    <div className="p-3">
                      <div className="font-semibold text-sm leading-tight text-neutral-800">{p.name}</div>
                    </div>
                    <button onClick={() => setSelectedProducts(selectedProducts.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full text-red-500 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={startPoll} disabled={selectedProducts.length < 2} className="w-full sm:w-auto">
            Iniciar Votação
          </Button>
        </CardFooter>
      </Card>

      {activePolls.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-neutral-900">Votações Ativas</h3>
          {activePolls.map(currentPoll => (
            <Card key={currentPoll.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{currentPoll.title || "Votação em Andamento"}</span>
                  <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Ativa
                  </span>
                </CardTitle>
                <CardDescription>
                  <div className="mb-4 flex flex-col md:flex-row gap-4 text-neutral-600 font-medium">
                     <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Encerra: {currentPoll.endDate?.split('-').reverse().join('/') || "-"}</span>
                     <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> Promoção: {currentPoll.promoDate?.split('-').reverse().join('/') || "-"}</span>
                  </div>
                  Compartilhe o link de votação com seus clientes: 
                  <div className="mt-2 flex">
                    <Input readOnly value={`${window.location.origin}/votar?id=${currentPoll.id}`} className="rounded-r-none" />
                    <Button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/votar?id=${currentPoll.id}`);
                      toast.success("Link copiado!");
                    }} className="rounded-l-none">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-4 text-lg">Resultados ao Vivo:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPoll.products.map((p: any) => {
                    const pollRes = pollResults[currentPoll.id] || {};
                    const votes = pollRes[p.id] || 0;
                    const totalVotes = Object.values(pollRes).reduce((a: any, b: any) => a + b, 0) as number;
                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    
                    return (
                      <div key={p.id} className="border border-neutral-200 rounded-xl p-4 flex items-center space-x-4">
                        <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <div className="font-semibold text-neutral-900">{p.name}</div>
                          <div className="text-sm text-neutral-500">{votes} votos ({percent}%)</div>
                          <div className="w-full bg-neutral-100 rounded-full h-2 mt-2">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const pageSize = 20;
                  const currentPage = pollPages[currentPoll.id] || 1;
                  const voters = votersList[currentPoll.id] || [];
                  const totalPages = Math.ceil(voters.length / pageSize) || 1;
                  const paginatedVoters = voters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                  return voters.length > 0 ? (
                    <div className="mt-8">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                        <h3 className="font-semibold text-base text-neutral-700">Clientes que Votaram ({voters.length}):</h3>
                        {totalPages > 1 && (
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPollPages(prev => ({...prev, [currentPoll.id]: currentPage - 1}))}>Anterior</Button>
                            <span className="text-sm font-medium">Pág. {currentPage} de {totalPages}</span>
                            <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPollPages(prev => ({...prev, [currentPoll.id]: currentPage + 1}))}>Próxima</Button>
                          </div>
                        )}
                      </div>
                      <div className="bg-neutral-50 rounded-xl border border-neutral-200">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-neutral-100 text-neutral-500 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 font-medium">Nome</th>
                              <th className="px-4 py-3 font-medium">WhatsApp</th>
                              <th className="px-4 py-3 font-medium">Produto Votado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {paginatedVoters.map((voter: any, idx: number) => {
                              const product = currentPoll.products.find((p:any) => p.id === voter.productId);
                              return (
                                <tr key={idx} className="hover:bg-neutral-100/50">
                                  <td className="px-4 py-3 font-medium text-neutral-900">{voter.customerName || "-"}</td>
                                  <td className="px-4 py-3 text-neutral-600">{voter.customerPhone}</td>
                                  <td className="px-4 py-3 text-neutral-600 truncate max-w-[150px]">{product?.name || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
              <CardFooter>
                <Button onClick={() => stopPoll(currentPoll.id)} variant="destructive">Encerrar Votação</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {inactivePolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-neutral-900">Últimas Votações (Encerradas)</h3>
          {inactivePolls.map(poll => (
             <Card key={poll.id} className="border-neutral-200 bg-neutral-50/50">
              <CardHeader>
                <CardTitle className="text-neutral-500">{poll.title}</CardTitle>
                <CardDescription>
                  Encerrada em: {poll.endDate?.split('-').reverse().join('/') || "-"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                    {poll.products.map((p: any) => {
                      const pollRes = pollResults[poll.id] || {};
                      const votes = pollRes[p.id] || 0;
                      return (
                        <div key={p.id} className="border border-neutral-300 rounded-xl p-4 flex items-center space-x-4 bg-white">
                          <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-md" />
                          <div className="flex-1">
                            <div className="font-semibold text-neutral-900">{p.name}</div>
                            <div className="text-sm font-medium text-neutral-600 border px-2 py-1 inline-block mt-1 bg-neutral-100 rounded-md">{votes} votos</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {(() => {
                    const pageSize = 20;
                    const currentPage = pollPages[poll.id] || 1;
                    const voters = votersList[poll.id] || [];
                    const totalPages = Math.ceil(voters.length / pageSize) || 1;
                    const paginatedVoters = voters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                    return voters.length > 0 ? (
                      <div className="mt-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                          <h3 className="font-semibold text-base text-neutral-500">Histórico de Votos ({voters.length}):</h3>
                          {totalPages > 1 && (
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPollPages(prev => ({...prev, [poll.id]: currentPage - 1}))}>Anterior</Button>
                              <span className="text-sm font-medium">Pág. {currentPage} de {totalPages}</span>
                              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPollPages(prev => ({...prev, [poll.id]: currentPage + 1}))}>Próxima</Button>
                            </div>
                          )}
                        </div>
                        <div className="bg-neutral-50/50 rounded-xl border border-neutral-200">
                          <table className="w-full text-sm text-left opacity-80">
                            <thead className="bg-neutral-100 text-neutral-500 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">WhatsApp</th>
                                <th className="px-4 py-3 font-medium">Produto Votado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                              {paginatedVoters.map((voter: any, idx: number) => {
                                const product = poll.products.find((p:any) => p.id === voter.productId);
                                return (
                                  <tr key={idx} className="hover:bg-neutral-100">
                                    <td className="px-4 py-3 font-medium text-neutral-700">{voter.customerName || "-"}</td>
                                    <td className="px-4 py-3 text-neutral-500">{voter.customerPhone}</td>
                                    <td className="px-4 py-3 text-neutral-500 truncate max-w-[150px]">{product?.name || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null;
                  })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

