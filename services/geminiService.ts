import { GoogleGenAI, Type } from "@google/genai";
import { MoleculeData } from "../types";

export interface ExplanationResult {
  remark: string;
  explanation: string;
}

export const getMoleculeExplanation = async (
  molecule: MoleculeData,
  wasCorrect: boolean
): Promise<ExplanationResult> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API_KEY is missing. Using local fallback for explanation.");
    return {
      remark: wasCorrect ? "Correct!" : "Incorrect!",
      explanation: wasCorrect 
        ? `Great job identifying the ${molecule.isPolar ? 'net dipole' : 'symmetry'} of ${molecule.name}.` 
        : `Look closely at the ${molecule.geometryName} geometry. ${molecule.isPolar ? 'The asymmetry creates a net dipole.' : 'The symmetry cancels out individual dipoles.'}`
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a chemistry tutor for a game called "Polar or Nah?".
    Molecule: ${molecule.name} (${molecule.formula}).
    Geometry: ${molecule.geometryName}.
    Actual Polarity: ${molecule.isPolar ? 'POLAR' : 'NON-POLAR'}.
    Player's Guess: ${wasCorrect ? 'CORRECT' : 'WRONG'}.

    Provide feedback in JSON format.
    1. 'remark': A short, punchy 2-5 word phrase. 
       - If Correct: enthusiastic (e.g., "Spot on!", "Perfect Vector Analysis!", "Chemistry Wizard!").
       - If Wrong: encouraging but clear (e.g., "Not quite.", "Check your symmetry.", "Dipoles cancelled you.").
    2. 'explanation': A single, clear sentence explaining WHY it is ${molecule.isPolar ? 'Polar' : 'Non-Polar'}. 
       - Mention specific geometry or electronegativity differences.
       - Explain if dipoles cancel or add up.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            remark: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["remark", "explanation"]
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    return {
      remark: data.remark || (wasCorrect ? "Well Done!" : "Oops!"),
      explanation: data.explanation || "Review the molecular geometry and bond vectors."
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      remark: wasCorrect ? "Good Eye!" : "Missed it!",
      explanation: "Focus on how the 3D shape affects vector cancellation."
    };
  }
};