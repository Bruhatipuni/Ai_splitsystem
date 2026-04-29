import React from 'react';

function Sidebar({ user, onLogout, activeTab, setActiveTab }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h2>💸 SmartSplit AI</h2>
      </div>

      <div className="sidebar-menu">
        <div 
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span>📊 Dashboard</span>
        </div>
        <div 
          className={`menu-item ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <span>👥 Groups</span>
        </div>
        <div 
          className={`menu-item ${activeTab === 'settle' ? 'active' : ''}`}
          onClick={() => setActiveTab('settle')}
        >
          <span>🤝 Settle Up</span>
        </div>
      </div>

      {user && (
        <div className="sidebar-footer">
          <div className="flex-row">
            <div className="avatar" style={{ background: '#3b82f6', width: '30px', height: '30px', fontSize: '1rem', marginRight: '10px' }}>
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc' }}>{user.name}</p>
              <button 
                onClick={onLogout} 
                style={{ 
                  background: 'transparent', 
                  color: '#94a3b8', 
                  padding: 0, 
                  margin: 0, 
                  boxShadow: 'none', 
                  fontSize: '0.8rem', 
                  textAlign: 'left',
                  width: 'auto' 
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
