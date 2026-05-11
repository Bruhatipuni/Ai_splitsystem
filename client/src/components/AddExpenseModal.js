import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function AddExpenseModal({ isOpen, onClose, user, groupId, members, onExpenseAdded }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('');
  
  // Array of member names who are participating in the split
  const [splitBetween, setSplitBetween] = useState([]);

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        
        try {
          const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/scan`, {
            imageBase64: base64Data,
            mimeType: file.type
          });
          
          if (res.data) {
            if (res.data.title) setTitle(res.data.title);
            if (res.data.amount) setAmount(res.data.amount.toString());
          }
        } catch (err) {
          console.error("Scan API error", err);
          alert("Failed to scan receipt. " + (err.response?.data?.msg || ""));
        } finally {
          setIsScanning(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading error", err);
      setIsScanning(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Add expense</h2>
          <button 
            type="button" 
            onClick={handleScanClick}
            disabled={isScanning}
            style={{ 
              background: '#e0e7ff', 
              color: '#4f46e5', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isScanning ? 'Scanning...' : '📷 Scan Receipt'}
          </button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            capture="environment"
          />
        </div>

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
