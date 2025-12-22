import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const createPrompt = (breakType, activity, history) => {
    let historySection;
    if (history) {
        historySection = JSON.stringify(history, null, 2);
    } else {
        historySection = 'No history available';
    }

    return `
You are an expert wellness AI assistant.

**Current Break Needed:** ${breakType}

**Recent Activity (last 10 min):**
- Mouse clicks: ${activity.clicks}
- Keyboard strokes: ${activity.keystrokes}
- Scroll distance: ${activity.scrollDistance}px
- Active screen time: ${Math.floor(activity.screenTime / 60)} minutes

**User's 7-day pattern:**
${historySection}

**Task:** 
Provide a personalized, actionable break recommendation.

Consider:
1. **Intensity:** High clicking = wrist strain. High typing = finger fatigue.
2. **Patterns:** If user skips breaks often, emphasize urgency.
3. **Break type:** Eye breaks = 20-20-20 rule. Stretch = full body.

**Response format (JSON only):**
{
  "title": "Short catchy title (max 5 words)",
  "message": "Specific, friendly instruction (2 sentences max)",
  "exercise": {
    "name": "Exercise name",
    "duration": "in seconds-according to break type",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "urgency": "low|medium|high"
}
`;
};

export const parseAIResponse = (text) => {
    const match = text.match(/{[\s\S]*}/);
    if (!match) {
        throw new Error("Invalid AI response format");
    }
    return JSON.parse(match[0]);
};

export const getAIRecommendation = async (breakType, activity, history) => {
    const prompt = createPrompt(breakType, activity, history);

    const result = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.candidates[0].content.parts[0].text;
    console.log("Ai response text: ", text);
    return parseAIResponse(text);
};
