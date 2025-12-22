import express from "express";
import { getAIRecommendation } from "./genai.js";

const router = express.Router();

const validateRequest = (req, res, next) => {
    const { breakType, activity } = req.body;

    if (!breakType || !activity) {
        return res.status(400).json({ error: "Missing required fields: breakType and activity" });
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
        const { breakType, activity, history } = req.body;
        const response = await getAIRecommendation(breakType, activity, history);
        res.json(response);
    } catch (error) {
        console.log("AI error: ", error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
