import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const createPrompt = (activity, history, lastBreakType) => {
    let historySection;
    if (history) {
        historySection = JSON.stringify(history, null, 2);
    } else {
        historySection = 'No history available';
    }

    const lastBreakInfo = lastBreakType ? `**Last break taken:** ${lastBreakType}` : '**Last break taken:** None yet';

    return `
You are an expert wellness AI assistant.

Last type pf break taken: ${lastBreakInfo}

**Recent Activity (current session):**
- Mouse clicks: ${activity.clicks}
- Keyboard strokes: ${activity.keystrokes}
- Scroll distance: ${activity.scrollDistance}px
- Active screen time: ${Math.floor(activity.screenTime / 60)} minutes

**User's 7-day pattern:**
${historySection}

**Task:** 
Analyze the user's activity and provide the most appropriate break recommendation. 
Decide whether they need an eye break (20-20-20 rule) or a stretch break (full body movement) based on their activity patterns and what type of break they took last.

Consider:
1. **Activity intensity:** High clicking = wrist strain (suggest stretches). High typing = finger fatigue (suggest hand exercises).
2. **Screen time:** Long periods = eye strain (suggest eye breaks).
3. **Patterns:** If user has been sedentary, prioritize movement. If lots of visual work, prioritize eye rest.
4. **Break variety:** Alternate between eye and stretch breaks when possible for balanced wellness.
5. **Last break type:** Consider what they did last to provide variety.

**Response format (JSON only):**
{
  "title": "Short catchy title (max 5 words)",
  "message": "Specific, friendly instruction (2 sentences max)",
  "exercise": {
    "name": "Exercise name",
    "duration": "in seconds (20-60 for eye breaks, 30-90 for stretches)",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "urgency": "low|medium|high",
  "breakType": "eye|stretch"
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

export const getAIRecommendation = async (activity, history, lastBreakType) => {
    const prompt = createPrompt(activity, history, lastBreakType);

    const result = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.candidates[0].content.parts[0].text;
    console.log("Ai response text: ", text);
    return parseAIResponse(text);
};
