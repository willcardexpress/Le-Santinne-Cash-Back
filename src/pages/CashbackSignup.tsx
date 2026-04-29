import React, { useState } from "react";
import { collection, query, where, getDocs, getDoc, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Copy, Gift, MoveRight, Receipt, ShoppingBag, Trophy, Calendar, Hash, User, Mail, CreditCard, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function CashbackSignup() {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic CPF formatting verification
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        toast.error("CPF inválido", { description: "Por favor digite um CPF válido."});
        setLoading(false);
        return;
      }

      // Check if user already exists
      const docRef = doc(db, "public_balances", cleanCpf);
      const existing = await getDoc(docRef);

      if (existing.exists()) {
        toast.error("Cadastro existente", { description: "Ops, esse CPF já está cadastrado em nosso programa! Acesse a área do cliente." });
        setLoading(false);
        return;
      }

      // Add to customers collection
      try {
        await setDoc(doc(db, "customers", cleanCpf), {
          name: name,
          cpf: cleanCpf,
          email,
          phone,
          birthdate: birthdate || null,
          pointsBalance: 0,
          cashbackBalance: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        // Add to public balances for lookup
        await setDoc(docRef, {
          name: name,
          points: 0,
          cashback: 0,
          updatedAt: Date.now()
        });
      } catch (err: any) {
        toast.error("Erro no cadastro", { description: err.message });
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Cadastro realizado com sucesso!");

    } catch (err: any) {
      console.error(err);
      toast.error("Erro no cadastro", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-xl w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-black rounded-2xl mb-4">
            <img src="https://i.imgur.com/EskqL8N.png" alt="Logo" className="h-10 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-2">Programa de Cashback</h1>
          <p className="text-lg text-neutral-600">Cadastre-se para acumular saldo e ganhar descontos incríveis em suas compras!</p>
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-700">Nome Completo <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input 
                      id="name"
                      placeholder="Seu nome completo" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-10 h-12 bg-neutral-50/50 border-neutral-200 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-neutral-700">CPF <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input 
                      id="cpf"
                      placeholder="000.000.000-00" 
                      required
                      maxLength={14}
                      value={cpf}
                      onChange={e => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 3) value = value.slice(0,3) + "." + value.slice(3);
                        if (value.length > 7) value = value.slice(0,7) + "." + value.slice(7);
                        if (value.length > 11) value = value.slice(0,11) + "-" + value.slice(11, 13);
                        setCpf(value);
                      }}
                      className="pl-10 h-12 bg-neutral-50/50 border-neutral-200 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-700">E-mail <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="seu@email.com" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-neutral-50/50 border-neutral-200 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-neutral-700">WhatsApp <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input 
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999" 
                      required
                      value={phone}
                      onChange={e => {
                        let value = e.target.value.replace(/\D/g, "");
                        setPhone(value);
                      }}
                      className="pl-10 h-12 bg-neutral-50/50 border-neutral-200 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-neutral-700">Data de Nascimento <span className="text-neutral-400 font-normal">(Opcional)</span></Label>
                  <div className="relative">
                    <Cake className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input 
                      id="birthdate"
                      type="date"
                      value={birthdate}
                      onChange={e => setBirthdate(e.target.value)}
                      className="pl-10 h-12 bg-neutral-50/50 border-neutral-200 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    {loading ? "Cadastrando..." : "Quero Participar"}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-10 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Parabéns, {name.split(' ')[0]}!</h2>
              <p className="text-neutral-600 mb-8 max-w-[300px] mx-auto">
                Seu cadastro no programa de Cashback foi realizado com sucesso. A partir de agora, suas compras valem dinheiro de volta!
              </p>
              
              <div className="bg-neutral-50 p-6 rounded-2xl mb-8 border border-neutral-100 text-left">
                 <h3 className="font-semibold text-neutral-800 mb-2">Como acompanhar seu saldo?</h3>
                 <p className="text-sm text-neutral-600">
                   Acesse a área do cliente a qualquer momento para conferir seu saldo disponível e histórico de resgates!
                 </p>
              </div>

              <Button onClick={() => window.location.href = "/me"} className="h-12 px-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white w-full sm:w-auto">
                Acessar Área do Cliente
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
