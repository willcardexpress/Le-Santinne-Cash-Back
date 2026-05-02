import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const sendWhatsappMessage = async (phone: string, message: string) => {
  try {
    const docRef = doc(db, "settings", "store");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const settings = docSnap.data();
      
      if (!settings.autoSendWhatsapp) {
        console.log("Envio automático desativado. Mensagem não enviada.");
        return { success: true, skipped: true };
      }

      if (!settings.replyAgentUrl) {
        console.warn("URL da API do Reply Agent não configurada.");
        return { success: false, error: "URL não configurada" };
      }

      // Format phone to ensure it has the country code
      const formattedPhone = phone.replace(/\D/g, '');

      // Reply Agent common API structure (or adaptable by user)
      // Usually expects Bearer token or api key in headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (settings.replyAgentApiKey) {
        headers["Authorization"] = `Bearer ${settings.replyAgentApiKey}`;
      }

      const payload = {
        number: formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`,
        text: message,
        // Depending on Reply Agent docs, it might be 'message', 'body', etc.
        // Also sending phone and message for fallback compatibility with webhooks like Zapier/Make
        phone: formattedPhone.startsWith("55") ? formattedPhone : `55${formattedPhone}`,
        message: message
      };

      // Call Reply Agent API
      const response = await fetch(settings.replyAgentUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Reply Agent: ${response.statusText}`);
      }

      return { success: true };
    }
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return { success: false, error };
  }
};
