export const GoogleGenAI = jest.fn().mockImplementation(() => ({
  models: {
    generateContent: jest.fn().mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: '{"title": "Test Break", "message": "Test message.", "exercise": {"name": "Test", "duration": 10, "steps": []}, "urgency": "low"}' }]
        }
      }]
    })
  }
}));