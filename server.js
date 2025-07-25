const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// In-memory conversation history (for demo, not persistent)
const conversationHistory = [];

// Auto-increment conversation counter
let conversationCounter = 1;

// Initialize conversation counter from database
async function initializeConversationCounter() {
    try {
        const { data, error } = await supabase
            .from('Conversations')
            .select('conversation_id')
            .order('conversation_id', { ascending: false })
            .limit(1);
        
        if (error) {
            console.error('Error fetching max conversation_id:', error);
            return;
        }
        
        if (data && data.length > 0) {
            const maxId = parseInt(data[0].conversation_id);
            conversationCounter = maxId + 1;
            console.log(`Initialized conversation counter to: ${conversationCounter}`);
        } else {
            console.log('No existing conversations found. Starting from 1.');
        }
    } catch (err) {
        console.error('Error initializing conversation counter:', err);
    }
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided.' });
    
    // Generate auto-incrementing conversation ID
    const conversationId = conversationCounter.toString();
    conversationCounter++;
    
    // Save user message to conversation history
    conversationHistory.push({ role: 'user', content: message });
    
    try {
        // Save user message to Supabase
        const { error: userError } = await supabase
            .from('Conversations')
            .insert({
                conversation_id: conversationId,
                messages: { role: 'user', content: message }
            });
        
        if (userError) {
            console.error('Error saving user message to Supabase:', userError);
        }

        // Call OpenAI API
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
        
        // Save bot response to conversation history
        conversationHistory.push({ role: 'assistant', content: response });
        
        // Save bot response to Supabase
        const { error: botError } = await supabase
            .from('Conversations')
            .insert({
                conversation_id: conversationId,
                messages: { role: 'assistant', content: response }
            });
        
        if (botError) {
            console.error('Error saving bot message to Supabase:', botError);
        }
        
        res.json({ response });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Error contacting OpenAI API.' });
    }
});

// Initialize counter and start server
async function startServer() {
    await initializeConversationCounter();
    app.listen(PORT, () => {
        console.log(`Backend API running on http://localhost:${PORT}`);
    });
}

startServer(); 