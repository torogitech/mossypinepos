import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Write a short, appetizing, and punchy marketing description (max 1 sentences) for a  product named "${productName}" in the category "${category}".`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Delicious and freshly made.";
  }
};

export const generateProductDetails = async (productName: string, categories: string[]) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a store manager. Given the product name "${productName}", generate the following:
    1. A short, appetizing description (max 1 sentences).
    2. The best fitting category from this list: [${categories.join(', ')}].
    3. An estimated price in PHP (Philippine Peso).
    
    Return the result in JSON format.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
          },
          required: ["description", "category", "price"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating details:", error);
    return null;
  }
};