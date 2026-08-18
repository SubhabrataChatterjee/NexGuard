import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAi(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}

export async function askSafetyAssistant(userPrompt: string, userContext?: string): Promise<string> {
  const ai = getAi();

  const systemInstruction = `You are NexGuard Safety Companion, an intelligent, empathetic, and highly calm safety assistant.
Your goal is to provide non-authoritative safety tips, help users navigate journey safety, explain emergency resources, or guide users during stressful situations.
CRITICAL RULES:
1. NEVER claim you have contacted emergency services or police yourself. Always urge the user to call 100 or tap the red SOS button if they are in immediate danger.
2. Be concise, clear, and reassuring.
3. Keep responses structured, helpful, and easily readable under stress.`;

  if (!ai) {
    // Fallback response when Gemini API key is not configured or in offline mode
    return (
      `[NexGuard Safety Assistant Mode]\n\n` +
      `I'm here to support your journey. If you feel unsafe right now, tap the red SOS button or call emergency services (100) immediately.\n\n` +
      `Here are general safety guidelines:\n` +
      `• Share your live journey with trusted contacts using Safe Journey mode.\n` +
      `• Stay in well-lit public areas with visible transit or active foot traffic.\n` +
      `• Check nearby verified police stations or hospitals in the Emergency Resources tab.`
    );
  }

  try {
    const promptText = userContext
      ? `Context: ${userContext}\n\nUser Question: ${userPrompt}`
      : userPrompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 600,
      },
    });

    return response.text || 'I am here to assist you with safety information and guidance.';
  } catch (err) {
    console.error('Gemini Assistant Error:', err);
    return (
      `I am experiencing a temporary connection issue, but your safety remains active. ` +
      `If you are in danger, please tap the SOS button immediately or call local emergency services.`
    );
  }
}
