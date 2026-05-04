const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Expense = require("../models/Expense");

// POST: Create a new group
router.post("/create", async (req, res) => {
  try {
    const { name, emoji, members, createdBy } = req.body;

    if (!name || !members || members.length === 0 || !createdBy) {
      return res.status(400).json({ msg: "Name, members, and createdBy are required" });
    }

    const newGroup = new Group({
      name,
      emoji: emoji || "🌴",
      members,
      createdBy,
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ msg: "Server error creating group" });
  }
});

// GET: Fetch groups for a specific user
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find groups where the user is a member
    const groups = await Group.find({
      members: { $regex: new RegExp(`^${username}$`, "i") },
    }).sort({ createdAt: -1 });

    // Enhance groups with total expense calculation
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ groupId: group.name });
        
        // Exclude settlements from total expenses and total amount
        const nonSettlementExpenses = expenses.filter(exp => exp.title !== "Settlement Payment");
        const totalExpenses = nonSettlementExpenses.length;
        const totalAmount = nonSettlementExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Simple mock of 'You are owed' vs 'You owe'
        let youAreOwed = 0;
        let youOwe = 0;
        
        expenses.forEach((exp) => {
          if (exp.paidBy.toLowerCase() === username.toLowerCase()) {
            // User paid, others owe them
            exp.splitAmong.forEach((split) => {
              if (split.name.toLowerCase() !== username.toLowerCase()) {
                youAreOwed += split.amount;
              }
            });
          } else {
            // Someone else paid, user might owe
            exp.splitAmong.forEach((split) => {
              if (split.name.toLowerCase() === username.toLowerCase()) {
                youOwe += split.amount;
              }
            });
          }
        });

        // Net balance within this group
        const netOwe = youOwe - youAreOwed;

        return {
          ...group.toObject(),
          totalExpenses,
          totalAmount,
          netOwe, // if positive, you owe. If negative, you are owed.
        };
      })
    );

    res.json(enhancedGroups);
  } catch (err) {
    console.error("Error fetching user groups:", err);
    res.status(500).json({ msg: "Error fetching user groups" });
  }
});

module.exports = router;
