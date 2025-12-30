
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessEntry, ChatMessage, BehavioralInsights, WeeklyStrategy, CalendarEvent, GuardianAlert, EntryType } from "../types";
import { storageService } from "./storage";

export interface GeminiResponse {
  text: string;
  imageUrl?: string;
  sources?: { uri: string; title: string }[];
  isStrategyPlan?: boolean;
  suggestedSave?: boolean;
}

// Fixed missing export for DocumentScanner
/**
 * Analizza un documento tramite immagine base64 e ne estrae i dati strutturati.
 */
export const analyzeDocument = async (base64Data: string): Promise<{ type: EntryType, title: string, content: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Rimuoviamo il prefisso del data URL se presente
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        },
        {
          text: 'Analizza questo documento. Categorizzalo in uno di questi tipi: note, appointment, contact, document, general. Estrai un titolo breve e il contenuto testuale completo. Restituisci il risultato in formato JSON.',
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['note', 'appointment', 'contact', 'document', 'general'] },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ['type', 'title', 'content'],
      },
    },
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (e) {
    console.error("Braik Document Analysis Error:", e);
    return { 
      type: 'general', 
      title: 'Scansione Fallita', 
      content: 'L\'intelligenza artificiale non è riuscita a decodificare il documento. Assicurati che il testo sia leggibile e ben illuminato.' 
    };
  }
};

export const queryGemini = async (
  query: string, 
  history: ChatMessage[], 
  entries: BusinessEntry[],
  mode: 'search' | 'workspace' = 'search'
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const insights = storageService.getInsights();

  const isStrategyRequest = /organizza la settimana|pianifica settimana|roadmap settimanale|cosa devo fare questa settimana/i.test(query);

  if (isStrategyRequest && mode === 'workspace') {
    return { text: "Sto attivando il protocollo Neural Strategy Lab... Accedi alla sezione 'Neural Strategy' per visualizzare il piano completo.", isStrategyPlan: true };
  }

  const isImageRequest = /disegna|genera immagine|crea immagine|illustra|fammi un disegno/i.test(query);

  const contextText = entries.map(e => `
    [Tipo: ${e.type.toUpperCase()}]
    [Titolo: ${e.title}]
    [Contenuto: ${e.content}]
    [Data: ${e.date || 'N/A'}]
  `).join('\n---\n');

  const learningContext = `
    MEMORIA NEURALE UTENTE:
    - Stile di scrittura rilevato: ${insights.writingStyle}
    - Interessi/Topic frequenti: ${insights.frequentTopics.join(', ')}
    - Bisogni anticipati: ${insights.anticipatedNeeds.join(', ')}
  `;

  const systemInstruction = mode === 'search' 
    ? `Sei "Braik Neural Search", un motore di ricerca IA adattivo per imprenditori.
       IL TUO COMPITO:
       1. Analizza la richiesta e ADATTATI allo stile comunicativo dell'utente: ${insights.writingStyle}.
       2. Usa Google Search per dati freschi e incrociali col database aziendale.
       3. Se rilevi un'informazione fondamentale, imposta suggestSave a true.
       Cita sempre fonti verificate.`
    : `Sei "Braik Workspace Lab", il braccio destro strategico dell'imprenditore.
       IL TUO COMPITO:
       1. Impara come scrive l'utente (${insights.writingStyle}) e adatta i testi che generi.
       2. Usa il database aziendale come verità assoluta.
       3. Se rilevi una decisione strategica, imposta suggestSave a true.
       Mantieni un tono autorevole e orientato al risultato.`;

  try {
    if (isImageRequest) {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: [{ parts: [{ text: query }] }],
        config: { systemInstruction: systemInstruction + learningContext, imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });
      let text = "";
      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        else if (part.text) text = part.text;
      }
      return { text: text || "Asset visivo generato.", imageUrl };
    } else {
      const response = await ai.models.generateContent({
        // use gemini-3-flash-preview for search grounded text tasks
        model: mode === 'workspace' ? "gemini-3-pro-preview" : "gemini-3-flash-preview",
        contents: history.map(m => ({ 
          role: m.role === 'assistant' ? 'model' as const : 'user' as const, 
          parts: [{ text: m.content }] 
        })).concat([{ role: 'user', parts: [{ text: query }] }]),
        config: {
          systemInstruction: systemInstruction + `\n\nDATABASE AZIENDALE:\n${contextText}\n\n${learningContext}\n\nAnalizza se l'output contiene dati da salvare stabilmente.`,
          tools: mode === 'search' ? [{ googleSearch: {} }] : [],
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              suggestedSave: { type: Type.BOOLEAN }
            },
            required: ["text", "suggestedSave"]
          }
        },
      });

      const resJson = JSON.parse(response.text || '{}');
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        ?.map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title || 'Fonte Web' })) || [];

      // Background processes
      setTimeout(() => {
        extractInsights(history.concat([{ id: 'temp', role: 'user', content: query, timestamp: Date.now() }]));
        runGuardianCheck(entries, storageService.getCalendarEvents());
      }, 2000);

      return { text: resJson.text || "Protocollo completato.", sources, suggestedSave: resJson.suggestedSave };
    }
  } catch (error: any) {
    console.error("Braik Neural Error:", error);
    return { text: "Errore di sincronizzazione neurale." };
  }
};

export const runGuardianCheck = async (entries: BusinessEntry[], events: CalendarEvent[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = `
    EVENTI:\n${events.map(ev => `${ev.date} ${ev.time}: ${ev.title}`).join('\n')}
    NOTE:\n${entries.map(e => `${e.title}: ${e.content}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sei il Neural Guardian aziendale. Analizza i dati per trovare 3 tipi di alert:
      1. forgotten: compiti menzionati nelle note ma non presenti in calendario.
      2. anomaly: appuntamenti che sembrano sbagliati o conflittuali.
      3. strategy: suggerimenti per ottimizzare il workflow.
      
      DATI:\n${context}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              message: { type: Type.STRING },
              severity: { type: Type.STRING }
            },
            required: ["type", "message", "severity"]
          }
        }
      }
    });

    const rawAlerts = JSON.parse(response.text || '[]');
    const alerts: GuardianAlert[] = rawAlerts.map((a: any) => ({
      ...a,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }));

    const insights = storageService.getInsights();
    storageService.saveInsights({
      ...insights,
      guardianAlerts: alerts
    });
  } catch (e) {
    console.warn("Guardian check failed", e);
  }
};

export const generateWeeklyStrategy = async (entries: BusinessEntry[], events: CalendarEvent[]): Promise<WeeklyStrategy> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = `
    EVENTI CALENDARIO:\n${events.map(ev => `${ev.date} ${ev.time}: ${ev.title} (${ev.description})`).join('\n')}
    ---
    NOTE E DOCUMENTI AZIENDALI:\n${entries.map(e => `[${e.type}] ${e.title}: ${e.content}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Sei un COO (Chief Operating Officer) virtuale di alto livello. Analizza i dati forniti e genera una STRATEGIA SETTIMANALE ottimizzata.
      RESTITUISCI SOLO JSON.
      DATI:\n${context}`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw error;
  }
};

export const extractInsights = async (history: ChatMessage[]) => {
  if (history.length < 3) return;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const recentHistory = history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analizza e riassumi il profilo dell'imprenditore in JSON: writingStyle, frequentTopics (array), anticipatedNeeds (array). Conversazione:\n${recentHistory}`,
      config: { responseMimeType: "application/json" }
    });
    const newInsights = JSON.parse(response.text || '{}');
    const oldInsights = storageService.getInsights();
    storageService.saveInsights({ 
      ...oldInsights, 
      ...newInsights,
      lastAnalysis: Date.now() 
    });
  } catch (e) {}
};
