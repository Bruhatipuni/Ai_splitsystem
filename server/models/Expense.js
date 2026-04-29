const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: String,
    amount: Number,
    category: {
      type: String,
      default: "General",
    },
    paidBy: String,
    members: [String],
    groupId: String, // 🔥 MUST EXIST
    splitAmong: [
      {
        name: String,
        amount: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);