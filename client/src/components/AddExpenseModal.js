import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AddExpenseModal({ isOpen, onClose, user, groupId, members, onExpenseAdded }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('');
  
  // Array of member names who are participating in the split
  const [splitBetween, setSplitBetween] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaidBy(user?.name || '');
      // By default, everyone is selected
      setSplitBetween(members || []);
    }
  }, [isOpen, members, user]);

  if (!isOpen) return null;

  const toggleMember = (mName) => {
    if (splitBetween.includes(mName)) {
      setSplitBetween(splitBetween.filter(m => m !== mName));
    } else {
      setSplitBetween([...splitBetween, mName]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !amount || splitBetween.length === 0) {
      alert("Please fill all required fields and select at least one person to split with.");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/add`, {
        title,
        amount: Number(amount),
        category,
        paidBy,
        members: members,
        splitBetween,
        groupId
      });
      
      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error("Error adding expense", err);
      alert("Failed to add expense");
    }
  };

  const categories = ["Food", "Lodging", "Transport", "Activities", "Shopping", "General"];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', color: '#0f172a' }}>Add expense</h2>

        <div className="form-group">
          <label style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>What was it for?</label>
          <input 
            type="text" 
            placeholder="e.g. Pizza dinner" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>Amount</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>Paid by</label>
          <select className="form-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map(m => (
              <option key={m} value={m}>{m === user?.name ? 'You' : m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Split between</label>
          <div className="split-checklist">
            {members.map(m => {
              const isSelected = splitBetween.includes(m);
              const displayName = m === user?.name ? 'You' : m;
              return (
                <div 
                  key={m} 
                  className={`split-check-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleMember(m)}
                >
                  <div className="check-circle"></div>
                  {displayName}
                </div>
              );
            })}
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={handleSubmit}>
          Add expense
        </button>
      </div>
    </div>
  );
}

export default AddExpenseModal;
