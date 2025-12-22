import request from 'supertest';
import { createApp } from '../server.js';
import * as genai from '../genai.js';

describe('POST /analyze', () => {
    let app;
    let mockGetAIRecommendation;

    beforeAll(() => {
        app = createApp();
        // Mock the getAIRecommendation function
        mockGetAIRecommendation = jest.spyOn(genai, 'getAIRecommendation');
    });

    afterEach(() => {
        // Clear all mocks after each test
        mockGetAIRecommendation.mockClear();
    });

    afterAll(() => {
        // Restore the original function after all tests are done
        mockGetAIRecommendation.mockRestore();
    });

    it('should return a 200 and AI recommendation for valid input', async () => {
        const mockRecommendation = {
            title: "Quick Stretch",
            message: "Stand up and stretch your arms above your head.",
            exercise: { name: "Overhead Stretch", duration: 30, steps: [] },
            urgency: "low"
        };
        mockGetAIRecommendation.mockResolvedValue(mockRecommendation);

        const validBody = {
            breakType: "eye",
            activity: { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 },
            history: []
        };

        const res = await request(app)
            .post('/analyze')
            .send(validBody)
            .expect(200);

        expect(res.body).toEqual(mockRecommendation);
        expect(mockGetAIRecommendation).toHaveBeenCalledTimes(1);
        expect(mockGetAIRecommendation).toHaveBeenCalledWith(
            validBody.breakType,
            validBody.activity,
            validBody.history
        );
    });

    it('should return a 400 error if breakType is missing', async () => {
        const invalidBody = {
            activity: { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 },
            history: []
        };

        const res = await request(app)
            .post('/analyze')
            .send(invalidBody)
            .expect(400);

        expect(res.body.error).toBe("Missing required fields: breakType and activity");
        expect(mockGetAIRecommendation).not.toHaveBeenCalled();
    });

    it('should return a 400 error if activity is missing', async () => {
        const invalidBody = {
            breakType: "eye",
            history: []
        };

        const res = await request(app)
            .post('/analyze')
            .send(invalidBody)
            .expect(400);

        expect(res.body.error).toBe("Missing required fields: breakType and activity");
        expect(mockGetAIRecommendation).not.toHaveBeenCalled();
    });

    it('should return a 400 error if activity data types are invalid', async () => {
        const invalidBody = {
            breakType: "eye",
            activity: { clicks: "abc", keystrokes: 50, scrollDistance: 200, screenTime: 300 },
            history: []
        };

        const res = await request(app)
            .post('/analyze')
            .send(invalidBody)
            .expect(400);

        expect(res.body.error).toBe("Invalid activity data types");
        expect(mockGetAIRecommendation).not.toHaveBeenCalled();
    });

    it('should return a 500 error if getAIRecommendation fails', async () => {
        mockGetAIRecommendation.mockRejectedValue(new Error("AI service unavailable"));

        const validBody = {
            breakType: "eye",
            activity: { clicks: 100, keystrokes: 50, scrollDistance: 200, screenTime: 300 },
            history: []
        };

        const res = await request(app)
            .post('/analyze')
            .send(validBody)
            .expect(500);

        expect(res.body.error).toBe("AI service unavailable");
        expect(mockGetAIRecommendation).toHaveBeenCalledTimes(1);
    });
});
