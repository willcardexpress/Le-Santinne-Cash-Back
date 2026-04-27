import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Check, Save } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [settings, setSettings] = useState({
    blingClientId: "",
    blingClientSecret: "",
    cashbackPercent: 5,
    pointsPerCurrency: 1,
    pointsThreshold: 150,
    birthdayMessage: "Parabéns {nome}! Você ganhou {pontos} pontos de presente da nossa loja!",
    pointsMessage: "Olá {nome}, obrigado por seu Pedido #{numero_pedido}! Você comprou:\n{produtos_com_valores}\n\nValor total: R$ {valor_total}. Você ganhou {pontos} pontos! Seu saldo atual é {saldo} pontos.",
    thresholdMessage: "Uau, {nome}! Você alcançou {saldo} pontos. Que tal trocar por um desconto na loja física ou online?",
    autoSendWhatsapp: false,
  });

  const webhookUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/api/bling/webhook`;
  const inviteLink = settings.blingClientId ? `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${settings.blingClientId}&state=Fidelidade123` : "";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "store");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "store"), {
        ...settings,
        updatedAt: Date.now()
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    toast.success("URL do Webhook copiada!");
  }

  if(loading) return <div>Carregando configurações...</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
        <p className="text-xs text-muted-foreground tracking-wide">Integração e Automação de Marketing</p>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-neutral-50/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Integração ERP Bling</CardTitle>
          <CardDescription className="text-xs">
            Configure sua chave de API e Webhook para automatizar o cashback a cada venda efetuada no Bling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="blingClientId" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Client ID</Label>
              <Input 
                id="blingClientId" 
                placeholder="Client ID (Bling)" 
                value={settings.blingClientId}
                className="bg-white border-border h-10"
                onChange={e => setSettings({...settings, blingClientId: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blingClientSecret" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Client Secret</Label>
              <Input 
                id="blingClientSecret" 
                type="password" 
                placeholder="Client Secret (Bling)" 
                value={settings.blingClientSecret}
                className="bg-white border-border h-10"
                onChange={e => setSettings({...settings, blingClientSecret: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Link de Convite (Autorização)</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink || "Preencha o Client ID para gerar o link"} className="bg-neutral-50 border-border text-muted-foreground h-10" />
              <Button variant="outline" onClick={() => {
                if(inviteLink) {
                  window.open(inviteLink, '_blank');
                } else {
                  toast.error("Preencha o Client ID primeiro.");
                }
              }} className="border-border px-8">
                Autorizar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Clique ou envie este link para autorizar o aplicativo na conta Bling.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-100">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">URL de Webhook e Retorno</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="bg-neutral-50 border-border text-muted-foreground h-10" />
              <Button variant="outline" onClick={copyWebhook} className="border-border">
                {copiedUrl ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Cadastre esta URL no Bling tanto como "Redirect URI" do aplicativo, quanto em Preferências {'>'} Integrações {'>'} Callbacks para "Mudança de Situação de Pedido".</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-neutral-50/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Regras de Fidelidade & Cashback</CardTitle>
          <CardDescription className="text-xs">Defina quanto vale cada venda e a porcentagem de cashback.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 pt-6">
           <div className="space-y-2">
            <Label htmlFor="cashbackPercent" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">% de Cashback por Compra</Label>
            <Input 
              id="cashbackPercent" 
              type="number" 
              value={settings.cashbackPercent}
              className="bg-white border-border h-10 text-lg font-light text-primary"
              onChange={e => setSettings({...settings, cashbackPercent: Number(e.target.value)})}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="pointsPerCurrency" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">1 Real (R$) equivale a X pontos</Label>
            <Input 
              id="pointsPerCurrency" 
              type="number" 
              value={settings.pointsPerCurrency}
              className="bg-white border-border h-10 text-lg font-light"
              onChange={e => setSettings({...settings, pointsPerCurrency: Number(e.target.value)})}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-neutral-50/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Automação de Mensagens (WhatsApp/SMS)</CardTitle>
          <CardDescription className="text-xs">
             Configure as mensagens automáticas enviadas para os clientes. 
             (Simulado neste ambiente)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 bg-white">
           <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100">
              <input 
                type="checkbox" 
                id="autoSendWhatsapp"
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                checked={settings.autoSendWhatsapp}
                onChange={e => setSettings({...settings, autoSendWhatsapp: e.target.checked})}
              />
              <Label htmlFor="autoSendWhatsapp" className="font-semibold text-sm">Ativar envio automático de mensagens via WhatsApp</Label>
           </div>
           
           <div className="space-y-2 pb-4 border-b border-neutral-100">
             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Alerta de Meta de Pontos</Label>
             <div className="flex items-center space-x-4 mb-2">
               <Label className="text-sm">Notificar ao alcançar a cada:</Label>
               <Input 
                 type="number"
                 className="w-24 bg-white border-border h-8 text-sm"
                 value={settings.pointsThreshold}
                 onChange={e => setSettings({...settings, pointsThreshold: Number(e.target.value)})}
               />
               <span className="text-sm text-muted-foreground">pontos</span>
             </div>
             <Textarea 
                value={settings.thresholdMessage}
                className="bg-neutral-50/50 border-border text-sm resize-none"
                onChange={e => setSettings({...settings, thresholdMessage: e.target.value})}
                rows={3} 
             />
             <p className="text-[10px] text-muted-foreground">Enviado sempre que o cliente atinge ou ultrapassa um múltiplo dessa meta. Variáveis: <span className="font-mono text-primary">{'{nome}'}</span>, <span className="font-mono text-primary">{'{saldo}'}</span></p>
           </div>
           
           <div className="space-y-2">
             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Mensagem de Compra / Cashback</Label>
             <Textarea 
                value={settings.pointsMessage}
                className="bg-neutral-50/50 border-border text-sm resize-none"
                onChange={e => setSettings({...settings, pointsMessage: e.target.value})}
                rows={4} 
             />
             <p className="text-[10px] text-muted-foreground">Variáveis suportadas: <span className="font-mono text-primary">{'{nome}'}</span>, <span className="font-mono text-primary">{'{produtos_com_valores}'}</span>, <span className="font-mono text-primary">{'{valor_total}'}</span>, <span className="font-mono text-primary">{'{numero_pedido}'}</span>, <span className="font-mono text-primary">{'{pontos}'}</span>, <span className="font-mono text-primary">{'{saldo}'}</span></p>
           </div>

           <div className="space-y-2">
             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Mensagem de Aniversário</Label>
             <Textarea 
                value={settings.birthdayMessage}
                className="bg-neutral-50/50 border-border text-sm resize-none"
                onChange={e => setSettings({...settings, birthdayMessage: e.target.value})}
                rows={3} 
             />
             <p className="text-[10px] text-muted-foreground">Variáveis suportadas: <span className="font-mono text-primary">{'{nome}'}</span>, <span className="font-mono text-primary">{'{pontos}'}</span></p>
           </div>
        </CardContent>
        <CardFooter className="bg-neutral-50/50 border-t border-border flex justify-end p-6">
             <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
               {saving ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>}
             </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
