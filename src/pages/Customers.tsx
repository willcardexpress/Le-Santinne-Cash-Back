import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "@/lib/utils";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", cpf: "", phone: "" });

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.cpf) {
        toast.error("Nome e CPF são obrigatórios.");
        return;
    }
    setIsAdding(true);
    try {
      await addDoc(collection(db, "customers"), {
        ...newCustomer,
        pointsBalance: 0,
        cashbackBalance: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      await setDoc(doc(db, "public_balances", newCustomer.cpf.replace(/\D/g, '')), {
        name: newCustomer.name,
        points: 0,
        cashback: 0,
        updatedAt: Date.now()
      });
      toast.success("Cliente adicionado com sucesso!");
      setIsDialogOpen(false);
      setNewCustomer({ name: "", email: "", cpf: "", phone: "" });
    } catch (error) {
       toast.error("Erro ao adicionar cliente.");
       handleFirestoreError(error, OperationType.CREATE, "customers");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
          <p className="text-xs text-muted-foreground tracking-wide">Gerencie o saldo e cashback de seus clientes.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Cliente
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddCustomer}>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Adicione um novo cliente para começar a acumular pontos e cashback.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Ex: Maria da Silva" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    value={newCustomer.cpf}
                    onChange={(e) => setNewCustomer({...newCustomer, cpf: e.target.value})}
                    placeholder="Apenas números" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input 
                      id="phone" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="(11) 99999-9999" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="email@exemplo.com" 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-neutral-50/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Base de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou CPF..."
                className="pl-8 bg-white border-border text-sm h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Nome</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">CPF</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Saldo de Pontos</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Cashback</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Data Cadastro</TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase text-muted-foreground tracking-wider text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">Buscando clientes...</TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, i) => (
                    <TableRow key={customer.id} className={`${i % 2 === 0 ? 'bg-transparent' : 'bg-neutral-50/50'} border-border border-b`}>
                      <TableCell className="font-medium text-sm text-foreground">{customer.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{customer.cpf}</TableCell>
                      <TableCell>
                         <Badge variant="secondary" className="font-bold text-[10px] tracking-wider text-primary bg-primary/10 border-none">{customer.pointsBalance} pts</Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-bold text-sm">
                         R$ {(customer.cashbackBalance || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm" className="text-[10px] tracking-wider font-bold text-muted-foreground hover:text-foreground">EXTRATO</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
