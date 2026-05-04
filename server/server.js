require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/splitDB")
.then(() => console.log("MongoDB Connected"));

const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const groupRoutes = require("./routes/groupRoutes");

app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));