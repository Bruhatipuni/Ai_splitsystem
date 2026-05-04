import React, { useState } from 'react';
import axios from 'axios';

const emojis = ['🌴', '🏠', '🍕', '✈️', '🎉', '🚗', '🏕️', '🎬', '⛱️', '🎂', '☕', '🛒'];

function CreateGroupModal({ isOpen, onClose, user, onGroupCreated }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌴');
  const [members, setMembers] = useState(['You']); // 'You' corresponds to the current user
  
  if (!isOpen) return null;

  const handleAddMember = () => {
    setMembers([...members, `Member ${members.length + 1}`]);
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Group name is required");
      return;
    }

    // Process members: replace 'You' with actual username, filter out empties, and remove duplicates (case-insensitive)
    const uniqueMembersMap = new Map();
    members.forEach(m => {
      let name = m.toLowerCase() === 'you' ? user.name : m.trim();
      if (name.length > 0) {
        uniqueMembersMap.set(name.toLowerCase(), name);
      }
    });

    const finalMembers = Array.from(uniqueMembersMap.values());

    // Ensure user is always in the group
    if (!uniqueMembersMap.has(user.name.toLowerCase())) {
      finalMembers.push(user.name);
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/create`, {
        name: name.trim(),
        emoji,
        members: finalMembers,
        createdBy: user.name
      });
      
      onGroupCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create group", err);
      alert("Failed to create group");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Create a new group</h2>

        <div className="form-group">
          <label>Group name</label>
          <input 
            type="text" 
            placeholder="e.g. Weekend Cabin" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Pick an emoji</label>
          <div className="emoji-picker">
            {emojis.map(e => (
              <div 
                key={e} 
                className={`emoji-btn ${emoji === e ? 'active' : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Members</label>
          <div className="members-list">
            {members.map((member, index) => (
              <div className="member-input-row" key={index}>
                <input 
                  type="text" 
                  value={member} 
                  disabled={index === 0 && member === 'You'}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                />
              </div>
            ))}
            <button className="btn-outline" onClick={handleAddMember} style={{ textAlign: 'left', marginTop: '8px' }}>
              + Add member
            </button>
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handleSubmit}>
          Create group
        </button>
      </div>
    </div>
  );
}

export default CreateGroupModal;
