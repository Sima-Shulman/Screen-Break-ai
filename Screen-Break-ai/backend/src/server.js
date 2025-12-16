import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// app.post("/analyze", async (req, res) => {
//     const { breakType, activity } = req.body;

//     const prompt = `
// You are a productivity assistant.

// Break type: ${breakType}

// User activity data:
// - clicks: ${activity.clicks}
// - keystrokes: ${activity.keystrokes}
// - scroll distance: ${activity.scrollDistance}
// - screen time (ms): ${activity.screenTime}

// Return a short, friendly recommendation for this break.
// Respond ONLY as JSON:
// {
//   "title": "...",
//   "message": "..."
// }
// `;

//     const result = await genai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: [{ role: "user", parts: [{ text: prompt }] }]
//     });

//     const text = result.candidates[0].content.parts[0].text;

//     console.log("AI Response:", text);

//     // Extract the JSON string from the markdown code block
//     const match = text.match(/{[\s\S]*}/);
//     if (match) {
//         res.json(JSON.parse(match[0]));
//     } else {
//         res.status(500).json({ error: "Invalid JSON response from AI" });
//     }
// });


app.post("/analyze", async (req, res) => {
    const { breakType, activity, history } = req.body;

    const prompt = `
You are an expert wellness AI assistant.

**Current Break Needed:** ${breakType}

**Recent Activity (last 10 min):**
- Mouse clicks: ${activity.clicks}
- Keyboard strokes: ${activity.keystrokes}
- Scroll distance: ${activity.scrollDistance}px
- Active screen time: ${Math.floor(activity.screenTime / 60)} minutes

**User's 7-day pattern:**
${history ? JSON.stringify(history, null, 2) : 'No history available'}

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
    "duration": in seconds-according to break type,
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "urgency": "low|medium|high"
}
`;

    const result = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.candidates[0].content.parts[0].text;
    const match = text.match(/{[\s\S]*}/);

    if (match) {
        res.json(JSON.parse(match[0]));
    } else {
        res.status(500).json({ error: "Invalid AI response" });
    }
});

app.listen(3001, () => {
    console.log("AI server running on port 3001");
});