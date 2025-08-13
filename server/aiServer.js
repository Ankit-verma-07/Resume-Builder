import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = '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'; // Replace with your key

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ reply: 'Error talking to AI.' });
  }
});

app.listen(5000, () => console.log('AI Chat backend running on port 5000'));
