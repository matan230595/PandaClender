
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Priority } from '../lib/types';
import { supabase } from './supabase';

// Function to get API keys from the user's profile in Supabase
export const getApiKeys = async (): Promise<string[]> => {
  if (!supabase) return [];
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
        .from('user_profile_progress')
        .select('api_keys')
        .eq('user_id', user.id)
        .single();
    
    if (error || !data) {
        console.warn("Could not fetch API keys from user profile.", error?.message);
        return [];
    }
    
    return data.api_keys || [];

  } catch (e) {
    console.error("An unexpected error occurred while fetching API keys", e);
    return [];
  }
};

// Function to get a working GoogleGenAI instance
export const getGenAi = async (): Promise<GoogleGenAI | null> => {
  const keys = await getApiKeys();
  if (keys.length === 0) return null;

  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // Quick validation check
      await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "test" });
      return ai;
    } catch (error: any) {
      console.warn(`API key validation failed for key ending in ${key.slice(-4)}:`, error.message);
      
      // Instruction #8: Do not disqualify on 403 / referrer restriction.
      // If the error message indicates a permission issue (403) or referrer restriction,
      // we proceed with this key anyway, assuming it might work in a different context or the check was false positive.
      if (error.message && (error.message.includes("403") || error.message.toLowerCase().includes("referrer"))) {
          console.log("Key has 403/referrer issue, but proceeding as per policy.");
          return new GoogleGenAI({ apiKey: key });
      }
    }
  }
  return null;
};

export async function generateContentWithFallback(
  prompt: string, 
  config?: any
): Promise<GenerateContentResponse | null> {
  const ai = await getGenAi();
  if (!ai) return null;

  try {
    return await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      ...(config && { config }),
    });
  } catch (error: any) {
     console.error("generateContentWithFallback failed", error);
     throw error;
  }
}

const taskParserSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      dueDate: { type: Type.STRING },
      priority: { type: Priority.REGULAR, enum: [Priority.URGENT, Priority.IMPORTANT, Priority.REGULAR] },
      reminders: {
        type: Type.OBJECT,
        properties: {
          dayBefore: { type: Type.BOOLEAN },
          hourBefore: { type: Type.BOOLEAN },
          fifteenMinBefore: { type: Type.BOOLEAN },
        },
        required: ['dayBefore', 'hourBefore', 'fifteenMinBefore']
      }
    },
    required: ['title', 'dueDate', 'priority', 'reminders']
};

interface ParsedTask {
    title: string;
    dueDate: string;
    priority: Priority;
    reminders: { dayBefore: boolean; hourBefore: boolean; fifteenMinBefore: boolean; };
}

export async function parseTaskFromCommand(command: string): Promise<ParsedTask | null> {
    const ai = await getGenAi();
    if (!ai) throw new Error("לא הוגדר מפתח AI תקין.");

    const prompt = `You are a task management assistant for an app called PandaClender. Parse this Hebrew command: "${command}". Current time: ${new Date().toISOString()}. Extract title, dueDate (ISO), priority, and reminders.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: taskParserSchema },
        });
        
        if (response && response.text) {
            return JSON.parse(response.text.replace(/```json|```/g, '').trim());
        }
        return null;
    } catch (error: any) {
        throw new Error(`ה-AI לא הצליח לעבד את הבקשה: ${error?.message}`);
    }
}
