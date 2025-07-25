const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.static(__dirname));
app.use(express.json());

// In-memory conversation history (for demo, not persistent)
const conversationHistory = [];

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided.' });
    // Save user message
    conversationHistory.push({ role: 'user', content: message });
    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: conversationHistory,
                max_tokens: 150
            })
        });
        const data = await openaiRes.json();
        const response = data.choices?.[0]?.message?.content || 'No response.';
        // Save bot response
        conversationHistory.push({ role: 'assistant', content: response });
        res.json({ response });
    } catch (err) {
        res.status(500).json({ error: 'Error contacting OpenAI API.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 