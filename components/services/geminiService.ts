
import { GoogleGenAI } from "@google/genai";

// Always initialize with a named parameter for apiKey. 
// Do not provide a fallback to avoid violating security context requirements.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export const professionalizeDescription = async (baseDescription: string): Promise<string> => {
  if (!baseDescription || baseDescription.length < 3) return baseDescription;

  try {
    // Calling generateContent with the model name and prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform this casual invoice item description into a professional business line item: "${baseDescription}". Keep it concise (max 10-15 words). Return only the professional text.`,
      config: {
        temperature: 0.7,
        // When setting maxOutputTokens, thinkingBudget must also be set for Gemini 3/2.5 models.
        // We set thinkingBudget to 0 for lower latency as deep reasoning isn't required here.
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    // Access the .text property directly (not a method) as per SDK documentation
    return response.text?.trim() || baseDescription;
  } catch (error) {
    console.error("Gemini description enhancement failed:", error);
    return baseDescription;
  }
};

export const suggestTaxRate = async (location: string): Promise<number> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What is the standard VAT/Sales Tax rate for "${location}"? Return only the number (e.g., 20 or 7.5). If unknown, return 0.`,
      config: {
        temperature: 0.1,
        // When setting maxOutputTokens, thinkingBudget must also be set.
        maxOutputTokens: 20,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    
    const text = response.text || "";
    const rate = parseFloat(text.replace(/[^0-9.]/g, ''));
    return isNaN(rate) ? 0 : rate;
  } catch (error) {
    console.error("Gemini tax rate suggestion failed:", error);
    return 0;
  }
};
