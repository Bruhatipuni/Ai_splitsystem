const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

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