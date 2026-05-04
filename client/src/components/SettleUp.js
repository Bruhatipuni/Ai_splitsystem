import React, { useState } from 'react';
import axios from 'axios';

function SettleUp({ settlements, user, groupId, refresh }) {
  const [loading, setLoading] = useState(false);

  const handleMarkPaid = async (debtor, creditor, amount) => {
    if (!window.confirm(`Mark ₹${amount} as paid from ${debtor} to ${creditor}?`)) return;
    
    try {
      setLoading(true);
      // To settle a debt, we add an expense where the debtor pays the creditor directly.
      const payload = {
        title: "Settlement Payment",
        amount: amount,
        paidBy: debtor,
        members: [creditor],
        groupId: groupId,
      };

      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/add`, payload);
      alert("Debt settled! 🎉");
      if (refresh) refresh();
    } catch (err) {
      console.error("Error settling debt:", err);
      alert("Failed to settle debt.");
    } finally {
      setLoading(false);
    }
  };

  // Only show settlements where the current user is involved, or show all? 
  // Let's show all for the group, but highlight the user's.
  
  return (
    <div>
      <h1 className="dashboard-title">🤝 Settle Up</h1>
      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        Review the optimal transactions to settle all debts in <b style={{color: '#38bdf8'}}>{groupId}</b>.
      </p>

      {(!settlements || settlements.length === 0) ? (
        <div className="card">
          <p style={{ color: '#10b981', textAlign: 'center', margin: 0, fontWeight: 'bold' }}>
            🎉 All settled up! No one owes anything.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2>Suggested Transactions</h2>
          {settlements.map((s) => (
            <div className="settlement-card" key={s._id}>
              <div className="flex-row">
                <div className="avatar" style={{ background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' }}>
                  {s.from[0]}
                </div>
                <div>
                  <b style={{ color: s.from.toLowerCase() === user?.name?.toLowerCase() ? '#ef4444' : '#38bdf8' }}>{s.from}</b> 
                  {' owes '} 
                  <b style={{ color: s.to.toLowerCase() === user?.name?.toLowerCase() ? '#10b981' : '#38bdf8' }}>{s.to}</b>
                </div>
              </div>
              <div className="flex-row">
                <div className="settlement-amount" style={{ marginRight: '16px' }}>₹{s.amount}</div>
                <button 
                  onClick={() => handleMarkPaid(s.from, s.to, s.amount)}
                  disabled={loading}
                  style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.9rem', borderRadius: '8px' }}
                >
                  {loading ? '...' : 'Mark Paid'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SettleUp;
