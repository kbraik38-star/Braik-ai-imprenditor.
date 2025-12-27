
import { GoogleGenAI } from "@google/genai";
import { BusinessEntry, ChatMessage } from "../types";

export interface GeminiResponse {
  text: string;
  imageUrl?: string;
}

export const queryGemini = async (
  query: string, 
  history: ChatMessage[], 
  entries: BusinessEntry[]
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Rilevamento intent per generazione immagini
  const isImageRequest = /disegna|genera immagine|crea immagine|illustra|fammi un disegno/i.test(query);

  const contextText = entries.map(e => `
    [Tipo: ${e.type.toUpperCase()}]
    [Titolo: ${e.title}]
    [Contenuto: ${e.content}]
    [Data: ${e.date || 'N/A'}]
  `).join('\n---\n');

  const systemInstruction = `
Sei "Braik ai imprenditor", un'IA privata ed estremamente professionale per l'imprenditore.
Il tuo scopo è assistere nella gestione aziendale, legale e creativa.

⚠️ REGOLE DI CONOSCENZA E ACCESSO AL WEB:
1. Hai accesso prioritario alla memoria privata fornita (DATABASE AZIENDALE).
2. Hai il permesso di accedere al web TRAMITE I TUOI STRUMENTI INTERNI ESCLUSIVAMENTE per consultare LEGGI, COSTITUZIONI e NORMATIVE vigenti nello stato dell'utente o internazionali.
3. NON cercare nel web notizie di attualità, gossip, eventi sportivi o altre informazioni non legali/professionali.
4. Se l'utente chiede traduzioni, falle in modo contestuale ai documenti aziendali.
5. Se ti viene chiesto qualcosa fuori dagli ambiti consentiti (Memoria Privata o Leggi), rispondi: "Questa informazione non è disponibile nei dati aziendali o non rientra nella conoscenza legale consentita per questa sessione protetta."

🧠 CAPACITÀ:
- Traduzione professionale e legale (Italiano, Inglese, Francese, Tedesco, Spagnolo).
- Generazione di testi complessi: Business Plan, Contratti, Relazioni, PowerPoints (struttura).
- Creazione di immagini professionali (loghi, schemi, illustrazioni business).
- Analisi basata sulle leggi della Costituzione e dello Stato.

DATABASE AZIENDALE:
${contextText || "IL DATABASE È ATTUALMENTE VUOTO. BASATI SULLE LEGGI DELLO STATO SE PERTINENTE."}

DATA ODIERNA: ${new Date().toLocaleDateString('it-IT')}
  `;

  try {
    if (isImageRequest) {
      // Utilizziamo gemini-3-pro-image-preview per immagini di alta qualità
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ parts: [{ text: query }] }],
        config: {
          systemInstruction,
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
        }
      });

      let text = "";
      let imageUrl = "";

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text = part.text;
        }
      }

      return { text: text || "Ecco l'immagine professionale generata per te.", imageUrl };
    } else {
      // Utilizziamo gemini-3-pro-preview per ragionamento legale e testi complessi
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: history.map(m => ({ 
          role: m.role === 'assistant' ? 'model' as const : 'user' as const, 
          parts: [{ text: m.content }] 
        })).concat([{ role: 'user', parts: [{ text: query }] }]),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 2048 }, // Budget per ragionamento profondo legale
          temperature: 0.2, // Più deterministico per questioni legali
          tools: [{ googleSearch: {} }] // Permesso solo per ricerche legali come da istruzioni
        },
      });

      return { text: response.text || "Non sono riuscito a elaborare una risposta valida dai dati disponibili." };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Errore di connessione ai sistemi di intelligenza centrale. Verifica la tua connessione o riprova più tardi." };
  }
};
