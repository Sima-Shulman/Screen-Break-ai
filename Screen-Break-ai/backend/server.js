import express from "express";
import endpoints from "./endpoints.js";

export const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(endpoints); // Use the endpoints router
    return app;
};

const app = createApp();

const PORT = process.env.PORT || 3001;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`AI server running on port ${PORT}`);
    });
}

export default app;
