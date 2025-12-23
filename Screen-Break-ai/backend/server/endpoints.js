import express from "express";
import { getAIRecommendation } from "./genai.js";

const router = express.Router();

const validateRequest = (req, res, next) => {
    const { activity } = req.body;

    if (!activity) {
        return res.status(400).json({ error: "Missing required field: activity" });
    }

    if (typeof activity.clicks !== 'number' ||
        typeof activity.keystrokes !== 'number' ||
        typeof activity.scrollDistance !== 'number' ||
        typeof activity.screenTime !== 'number') {
        return res.status(400).json({ error: "Invalid activity data types" });
    }
    next();
};

router.post("/analyze", validateRequest, async (req, res) => {
    try {
        const { activity, history, lastBreakType } = req.body;
        const response = await getAIRecommendation(activity, history, lastBreakType);
        res.json(response);
    } catch (error) {
        console.log("AI error: ", error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
