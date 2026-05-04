import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Groups({ currentGroupId, setGroupId, user }) {
  const [inputGroup, setInputGroup] = useState('');
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.name) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/user/${user.name}/groups`);
        setMyGroups(res.data);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };
    fetchGroups();
  }, [user]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputGroup.trim()) {
      setGroupId(inputGroup.trim());
      setInputGroup('');
    }
  };

  return (
    <div className="card">
      <h2>👥 Manage Groups</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        You are currently viewing: <b style={{ color: '#38bdf8' }}>{currentGroupId}</b>
      </p>

      <form onSubmit={handleJoin} className="form" style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Enter a new group name to join or create..."
          value={inputGroup}
          onChange={(e) => setInputGroup(e.target.value)}
        />
        <button type="submit">Switch Group</button>
      </form>
      
      <div className="my-groups">
        <h3 style={{ marginBottom: '12px', color: '#e2e8f0' }}>My Active Groups</h3>
        {myGroups.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>You don't have any groups yet. Create one above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myGroups.map(g => (
              <div 
                key={g} 
                className={`menu-item ${currentGroupId === g ? 'active' : ''}`}
                onClick={() => setGroupId(g)}
                style={{ 
                  background: currentGroupId === g ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: currentGroupId === g ? '#38bdf8' : '#f8fafc'
                }}
              >
                <b style={{ fontSize: '1.1rem' }}>{g}</b>
                {currentGroupId === g && <span>✓ Active</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ color: '#94a3b8', marginTop: '20px', fontSize: '0.9rem' }}>
        * Groups are dynamically created when you add an expense to them.
      </p>
    </div>
  );
}

export default Groups;
