const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { GoogleGenAI } = require("@google/genai");

router.post("/", async (req, res) => {
  try {
    const { message, groupId } = req.body;

    if (!message) {
      return res.status(400).json({ msg: "Message is required" });
    }

    // Fetch group data for context
    const expenses = await Expense.find({ groupId });
    
    // Create a textual summary of the expenses for the AI
    let context = "Here are the recent expenses for this group:\\n";
    if (expenses.length === 0) {
      context += "No expenses yet.\\n";
    } else {
      expenses.forEach(exp => {
        context += `- ${exp.paidBy} paid ${exp.amount} for '${exp.title}' split among ${exp.members.join(", ")}.\\n`;
      });
    }

    const systemPrompt = `You are SmartSplit AI, a helpful and friendly financial assistant for a bill-splitting app.
Your job is to answer questions about the group's expenses based on the context provided.
Be concise, polite, and helpful.

Context:
${context}
`;

    // Helper function for offline fallback
    const getOfflineFallback = (msg, exps) => {
      let reply = "I'm currently running in offline mode because the API key is missing or out of quota. ";
      if (msg.toLowerCase().includes("total") || msg.toLowerCase().includes("spent")) {
        const total = exps.reduce((sum, e) => sum + e.amount, 0);
        reply += `However, I can tell you the total expenses amount to ₹${total}.`;
      } else if (msg.toLowerCase().includes("who")) {
        reply += "I can see the expenses, but I need an active API key to do deeper analysis.";
      } else {
        reply += "Please add a valid GEMINI_API_KEY in your server's .env file to enable full chat capabilities!";
      }
      return reply;
    };

    // Check if real keys are provided (ignore placeholders)
    const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';

    // Try using Gemini if real key is present
    if (hasGemini) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction: systemPrompt
        }
      });

      return res.json({ reply: response.text });
    } else if (hasOpenAI) {
      // Fallback to OpenAI (or Groq if a gsk_ key is provided)
      const OpenAI = require("openai");
      
      const isGroq = process.env.OPENAI_API_KEY.startsWith("gsk_");
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1",
      });

      const completion = await openai.chat.completions.create({
        model: isGroq ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      });

      return res.json({ reply: completion.choices[0].message.content });
    } else {
      // Fallback if no API key is provided
      console.warn("No GEMINI_API_KEY or OPENAI_API_KEY found. Returning fallback AI response.");
      return res.json({ reply: getOfflineFallback(message, expenses) });
    }

  } catch (err) {
    console.error("Chat Error:", err.message || err);
    
    // For ANY AI API error (quota, invalid key, rate limit, etc), fall back to offline mode
    // We already have the 'expenses' array from the top of the route!
    let reply = "The AI is currently unavailable (API Error). Switching to offline mode... ";
    
    if (req.body.message.toLowerCase().includes("total") || req.body.message.toLowerCase().includes("spent")) {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      reply += `However, I can still tell you that the total expenses amount to ₹${total}.`;
    } else if (req.body.message.toLowerCase().includes("who")) {
      reply += "I can see the expenses, but I need the AI connected to do deeper analysis.";
    } else {
      reply += "Please ensure your API key is valid and has available quota.";
    }
    
    return res.status(200).json({ reply });
  }
});

module.exports = router;
