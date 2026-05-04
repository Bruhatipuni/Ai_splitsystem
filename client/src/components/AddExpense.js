import { useState } from "react";
import axios from "axios";

function AddExpense({ onAdd, groupId }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔴 Basic validation
    if (!title || !amount || !paidBy || !members) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title,
        amount: Number(amount),
        paidBy: paidBy.trim(),
        members: members.split(",").map((m) => m.trim()),
        groupId, // 🔥 REQUIRED
      };

      console.log("Sending:", payload); // debug

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/add`,
        payload
      );

      console.log("Response:", res.data);

      alert("Expense added ✅");

      // 🔄 Refresh UI (VERY IMPORTANT)
      if (onAdd) onAdd();

      // 🧹 Reset form
      setTitle("");
      setAmount("");
      setPaidBy("");
      setMembers("");
    } catch (err) {
      console.error("ADD ERROR:", err.response?.data || err.message);
      alert("Failed to add expense ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Add Expense 💸</h2>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="text"
          placeholder="Paid By"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        />

        <input
          type="text"
          placeholder="Members (comma separated)"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;