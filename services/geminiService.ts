import { GoogleGenAI, Type } from "@google/genai";
import { Employee } from '../types';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("API Key not found. Create a .env file with VITE_API_KEY=your_key");
  return new GoogleGenAI({ apiKey });
};

export const generateSmartSchedule = async (
  employees: Employee[],
  weekStartDate: string,
  existingConstraints: string = "None"
) => {
  try {
    const ai = getAiClient();
    
    // Using a more structured prompt to ensure valid JSON output
    const prompt = `
      You are a team scheduler assistant.
      Generate a work-from-home (WFH) rotation schedule for the following employees:
      ${employees.map(e => e.name).join(', ')}.

      Rules:
      1. Each person should have exactly 2 days of WFH (Remote) per week (Mon-Fri).
      2. The other 3 days are Office.
      3. Try to balance the team so not everyone is WFH on the same day.
      4. Week starts on: ${weekStartDate}.
      5. Additional Constraints/Notes: ${existingConstraints}

      Return ONLY the raw JSON data adhering to the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  employeeName: { type: Type.STRING },
                  schedule: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING, description: "Day name e.g., Monday" },
                        status: { type: Type.STRING, enum: ["OFFICE", "WFH"] }
                      },
                      required: ["day", "status"]
                    }
                  }
                },
                required: ["employeeName", "schedule"]
              }
            }
          },
          required: ["schedules"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};
