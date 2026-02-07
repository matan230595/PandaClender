
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Function to get API keys from local storage
export const getApiKeys = (): string[] => {
  try {
    const storedKeys = localStorage.getItem('ff_api_keys_list');
    return storedKeys ? JSON.parse(storedKeys) : [];
  } catch (e) {
    console.error("Could not parse API keys", e);
    return [];
  }
};

// Function to get a working GoogleGenAI instance
export const getGenAi = async (): Promise<GoogleGenAI | null> => {
  const keys = getApiKeys();
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