

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
        .from('user_progress')
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
  if (keys.length === 0) {
    console.warn("No API keys found in settings.");
    return null;
  }

  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // Test the key with a simple request to ensure it's valid
      await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "test" });
      return ai; // Return the first valid instance
    } catch (error) {
      console.warn(`API key ending in ${key.slice(-4)} failed. Trying next...`);
    }
  }
  
  return null; // No valid key found
};


export async function generateContentWithFallback(
  prompt: string, 
  config?: any
): Promise<GenerateContentResponse | null> {
  const ai = await getGenAi();
  if (!ai) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      ...(config && { config }),
    });
    return response;
  } catch (error) {
     console.error("generateContentWithFallback failed", error);
     throw error;
  }
}

const taskParserSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The inferred title of the task.'
      },
      dueDate: {
        type: Type.STRING,
        description: 'The calculated due date and time in ISO 8601 format.'
      },
      priority: {
        type: Type.STRING,
        enum: [Priority.URGENT, Priority.IMPORTANT, Priority.REGULAR],
        description: 'The inferred priority of the task.'
      },
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
    reminders: {
        dayBefore: boolean;
        hourBefore: boolean;
        fifteenMinBefore: boolean;
    };
}

export async function parseTaskFromCommand(command: string): Promise<ParsedTask | null> {
    const ai = await getGenAi();
    if (!ai) {
        throw new Error("לא הוגדר מפתח AI. אנא הגדר אותו בהגדרות.");
    }

    const prompt = `You are a task management assistant for an app called PandaClender. Your job is to parse a user's command written in Hebrew and extract task details.
The current date and time is: ${new Date().toISOString()}.
You MUST return the response in a valid JSON format according to the provided schema.

User command: "${command}"

Based on the command, extract the following:
1.  **title**: The title of the task. Infer it from the command (e.g., "לקבוע תור לרופא" -> "לקבוע תור לרופא"). If no action is mentioned, use a generic title like "משימה".
2.  **dueDate**: The exact due date and time in ISO 8601 format. Calculate relative dates like "מחר" (tomorrow), "בעוד שעתיים" (in 2 hours), etc., based on the current date provided. If no time is specified, default to a reasonable time like 09:00 local time.
3.  **reminders**: An object representing the reminder settings.
    - If the user says "תזכיר שעה לפני" (remind an hour before), set \`hourBefore\` to true and others to false.
    - If "יום לפני" (a day before), set \`dayBefore\` to true and others to false.
    - If "15 דקות לפני" (15 minutes before), set \`fifteenMinBefore\` to true and others to false.
    - If no specific reminder is mentioned, set \`dayBefore\`, \`hourBefore\`, and \`fifteenMinBefore\` all to \`true\` as a sensible default.
4.  **priority**: Infer the task priority. If the command includes words like "דחוף", "בהול", "ASAP", set it to 'URGENT'. If it includes "חשוב", "חייב", set it to 'IMPORTANT'. Otherwise, default to 'REGULAR'.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskParserSchema,
            },
        });
        
        if (response && response.text) {
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonText);
            return parsed as ParsedTask;
        }
        return null;
    } catch (error) {
        console.error("AI task parsing failed", error);
        throw new Error("ה-AI לא הצליח לעבד את הבקשה. ייתכן שהמפתח אינו תקין.");
    }
}