import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function parseUniversalInput(input: string): Promise<AIParsedTask> {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this productivity input: "${input}". 
      Current Date: ${currentDate}
      Current Time: ${currentTime}
      
      Determine if it is a task or a note/idea. 
      Extract title, due date (if mentioned), priority (low, medium, high), and tags.
      Return the result in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dueDate: { type: Type.STRING, description: "ISO 8601 timestamp" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            isTask: { type: Type.BOOLEAN }
          },
          required: ["title", "isTask"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      title: result.title || input,
      dueDate: result.dueDate,
      priority: result.priority || 'medium',
      tags: result.tags || [],
      isTask: result.isTask ?? true
    };
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return {
      title: input,
      isTask: true,
      priority: 'medium',
      tags: []
    };
  }
}
