import { createPrompt, parseAIResponse, getAIRecommendation } from '../server/genai.js';

// Mock dotenv config to prevent actual API key loading issues in tests
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

// Mock the GoogleGenAI module
jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            models: {
                generateContent: jest.fn().mockResolvedValue({
                    candidates: [{
                        content: {
                            parts: [{ text: '{"title": "Test Break", "message": "Test message.", "exercise": {"name": "Test", "duration": 10, "steps": []}, "urgency": "low", "breakType": "eye"}' }]
                        }
                    }]
                })
            }
        }))
    };
});


describe('createPrompt', () => {
    it('should generate a prompt with all fields', () => {
        const activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };
        const history = [{ date: "2023-01-01", score: 80 }];
        const lastBreakType = "eye";
        const prompt = createPrompt(activity, history, lastBreakType);

        expect(prompt).toContain(`Mouse clicks: ${activity.clicks}`);
        expect(prompt).toContain(`Keyboard strokes: ${activity.keystrokes}`);
        expect(prompt).toContain(`Scroll distance: ${activity.scrollDistance}px`);
        expect(prompt).toContain(`Active screen time: ${Math.floor(activity.screenTime / 60)} minutes`);
        expect(prompt).toContain(JSON.stringify(history, null, 2));
        expect(prompt).toContain(`Response format (JSON only):`);
        expect(prompt).toContain(`"breakType": "eye|stretch"`);
        expect(prompt).toContain(`Last type pf break taken: **Last break taken:** ${lastBreakType}`);
    });

    it('should generate a prompt without history if not provided', () => {
        const activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
        const prompt = createPrompt(activity, null);

        expect(prompt).toContain(`No history available`);
        expect(prompt).toContain(`Analyze the user's activity and provide the most appropriate break recommendation`);
        expect(prompt).toContain(`**Last break taken:** None yet`);
    });

    it('should generate a prompt with an empty history array', () => {
        const activity = { clicks: 0, keystrokes: 0, scrollDistance: 0, screenTime: 0 };
        const history = [];
        const prompt = createPrompt(activity, history);

        expect(prompt).toContain(JSON.stringify(history, null, 2));
        expect(prompt).toContain(`Analyze the user's activity and provide the most appropriate break recommendation`);
        expect(prompt).toContain(`**Last break taken:** None yet`);
    });
});

describe('parseAIResponse', () => {
    it('should parse a valid JSON string from AI response', () => {
        const aiText = 'Some text before. {"title": "Test", "message": "Hi"} Some text after.';
        const parsed = parseAIResponse(aiText);
        expect(parsed).toEqual({ title: "Test", message: "Hi" });
    });

    it('should throw an error for invalid JSON format', () => {
        const aiText = 'Not a valid json response.';
        expect(() => parseAIResponse(aiText)).toThrow("Invalid AI response format");
    });

    it('should handle JSON with complex structure', () => {
        const aiText = '{"title": "Complex", "exercise": {"name": "Test", "steps": ["a", "b"]}}';
        const parsed = parseAIResponse(aiText);
        expect(parsed).toEqual({ title: "Complex", exercise: { name: "Test", steps: ["a", "b"] } });
    });
});

describe('getAIRecommendation', () => {
    let originalGoogleGenAI;
    
    beforeEach(() => {
        // Store the original mock
        const { GoogleGenAI } = require('@google/genai');
        originalGoogleGenAI = GoogleGenAI;
    });
    
    afterEach(() => {
        // Restore the original mock
        const genaiModule = require('@google/genai');
        genaiModule.GoogleGenAI = originalGoogleGenAI;
    });

    it('should call GoogleGenerativeAI and return parsed response', async () => {
        const activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };
        const history = [];
        const lastBreakType = "stretch";

        const recommendation = await getAIRecommendation(activity, history, lastBreakType);

        // Verify that GoogleGenAI was called
        const { GoogleGenAI } = require('@google/genai');
        expect(GoogleGenAI).toHaveBeenCalledTimes(1);
        const genaiInstance = GoogleGenAI.mock.results[0].value;
        expect(genaiInstance.models.generateContent).toHaveBeenCalledTimes(1);

        // Verify that the prompt was created and passed
        const expectedPrompt = createPrompt(activity, history, lastBreakType);
        expect(genaiInstance.models.generateContent).toHaveBeenCalledWith({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: expectedPrompt }] }]
        });

        // Verify the parsed response
        expect(recommendation).toEqual({
            title: "Test Break",
            message: "Test message.",
            exercise: { name: "Test", duration: 10, steps: [] },
            urgency: "low",
            breakType: "eye"
        });
    });

    it('should throw an error if AI response is invalid JSON', async () => {
        const activity = { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 };
        const history = [];
        const lastBreakType = "eye";

        // Override the existing mock for this test
        const { GoogleGenAI } = require('@google/genai');
        const mockInstance = GoogleGenAI.mock.results[0].value;
        mockInstance.models.generateContent.mockResolvedValueOnce({
            candidates: [{
                content: {
                    parts: [{ text: 'Not valid JSON.' }]
                }
            }]
        });

        await expect(getAIRecommendation(activity, history, lastBreakType)).rejects.toThrow("Invalid AI response format");
    });
});
