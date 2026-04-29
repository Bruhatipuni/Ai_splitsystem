const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      default: "🌴",
    },
    members: {
      type: [String],
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
