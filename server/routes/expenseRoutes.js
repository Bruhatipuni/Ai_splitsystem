const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { GoogleGenAI } = require("@google/genai");

// ✅ SCAN EXPENSE BILL
router.post("/scan", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ msg: "Image data is required" });
    }

    const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';

    if (!hasGemini && !hasOpenAI) {
      return res.status(503).json({ msg: "No AI API key is configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to .env" });
    }

    // Ensure we only have the raw base64 data, removing the prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `Analyze this receipt/bill. Extract the name of the store or a reasonable title for the expense, and the total amount. Return ONLY a valid JSON object with two keys: "title" (string) and "amount" (number). Do not include markdown formatting or any other text. Example: {"title": "Starbucks", "amount": 15.50}`;

    let jsonStr = "";

    if (hasGemini) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "image/jpeg"
            }
          },
          prompt
        ],
      });
      jsonStr = response.text.trim();
    } else if (hasOpenAI) {
      const OpenAI = require("openai");
      const isGroq = process.env.OPENAI_API_KEY.startsWith("gsk_");
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1",
      });

      const completion = await openai.chat.completions.create({
        model: isGroq ? "llama-3.2-90b-vision-preview" : "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
      });
      jsonStr = completion.choices[0].message.content.trim();
    }
    // the response text should be JSON, but might be enclosed in markdown like ```json ... ```
    if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);

  } catch (err) {
    console.error("Scan Error:", err);
    res.status(500).json({ msg: "Failed to scan image" });
  }
});

// ✅ ADD EXPENSE
router.post("/add", async (req, res) => {
  try {
    const { title, amount, category, paidBy, members, splitBetween, groupId } = req.body;

    // splitBetween is the array of members who are actually splitting this specific expense
    const actualSplitters = splitBetween && splitBetween.length > 0 ? splitBetween : members;

    if (!title || !amount || !paidBy || !actualSplitters || actualSplitters.length === 0) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const splitAmount = amount / actualSplitters.length;

    const expense = new Expense({
      title,
      amount,
      category: category || "General",
      paidBy,
      members, // We keep the full members array just for record, but splitAmong is what matters
      groupId,
      splitAmong: actualSplitters.map((m) => ({
        name: m,
        amount: splitAmount,
      })),
    });

    await expense.save();

    res.json(expense);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ GET ALL GROUPS FOR A USER
router.get("/user/:username/groups", async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find all expenses where user is paidBy OR in members array
    // We use case-insensitive regex for robust matching
    const expenses = await Expense.find({
      $or: [
        { paidBy: { $regex: new RegExp(`^${username}$`, 'i') } },
        { members: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    // Extract unique group IDs
    const groups = [...new Set(expenses.map(e => e.groupId))];
    
    res.json(groups);
  } catch (err) {
    console.error("Groups fetch error:", err);
    res.status(500).json({ msg: "Error fetching user groups" });
  }
});


// ✅ GET EXPENSES BY GROUP
router.get("/:groupId", async (req, res) => {
  try {
    const expenses = await Expense.find({
      groupId: req.params.groupId,
    }).sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching expenses" });
  }
});

// ✅ GET SETTLEMENTS BY GROUP
router.get("/settlements/:groupId", async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId });
    
    // Calculate net balances (case-insensitive)
    const balances = {};
    expenses.forEach(exp => {
      const paidBy = exp.paidBy.toLowerCase();
      balances[paidBy] = (balances[paidBy] || 0) + exp.amount;
      exp.splitAmong.forEach(split => {
        const splitName = split.name.toLowerCase();
        balances[splitName] = (balances[splitName] || 0) - split.amount;
      });
    });

    let debtors = [];
    let creditors = [];
    for (const [name, balance] of Object.entries(balances)) {
      if (balance < -0.01) debtors.push({ name, amount: -balance });
      else if (balance > 0.01) creditors.push({ name, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        _id: `${debtor.name}-${creditor.name}-${Date.now()}-${Math.random()}`,
        from: debtor.name,
        to: creditor.name,
        amount: parseFloat(amount.toFixed(2)),
        settled: false
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    res.json(settlements);
  } catch (err) {
    console.error("Settlement Error:", err);
    res.status(500).json({ msg: "Error calculating settlements" });
  }
});

module.exports = router;