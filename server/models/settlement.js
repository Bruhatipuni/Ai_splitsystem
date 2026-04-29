const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    amount: Number,
    settled: { type: Boolean, default: false },
    groupId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);