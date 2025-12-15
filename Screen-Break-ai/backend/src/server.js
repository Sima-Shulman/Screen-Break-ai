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

app.post("/analyze", async (req, res) => {
    const { breakType, activity } = req.body;

    const prompt = `
You are a productivity assistant.

Break type: ${breakType}

User activity data:
- clicks: ${activity.clicks}
- keystrokes: ${activity.keystrokes}
- scroll distance: ${activity.scrollDistance}
- screen time (ms): ${activity.screenTime}

Return a short, friendly recommendation for this break.
Respond ONLY as JSON:
{
  "title": "...",
  "message": "..."
}
`;

    const result = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.candidates[0].content.parts[0].text;

    console.log("AI Response:", text);
    
    // Extract the JSON string from the markdown code block
    const match = text.match(/{[\s\S]*}/);
    if (match) {
        res.json(JSON.parse(match[0]));
    } else {
        res.status(500).json({ error: "Invalid JSON response from AI" });
    }
});

app.listen(3001, () => {
    console.log("AI server running on port 3001");
});
