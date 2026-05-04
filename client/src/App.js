import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import Login from "./components/Login";
import Chatbot from "./components/Chatbot";
import CreateGroupModal from "./components/CreateGroupModal";
import AddExpenseModal from "./components/AddExpenseModal";

function App() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [groupId, setGroupId] = useState(null);
  
  const [myGroups, setMyGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // 🔄 Fetch all data
  const fetchData = useCallback(async () => {
    try {
      if (user?.name) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/user/${user.name}`);
        setMyGroups(res.data);
      }

      if (groupId) {
        const exp = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/${groupId}`);
        setExpenses(exp.data);

        const setl = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/settlements/${groupId}`);
        setSettlements(setl.data);
      }
    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  }, [groupId, user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const handleGroupClick = (gId) => {
    setGroupId(gId);
    setActiveTab('group-details');
  };

  // 🔐 LOGIN SCREEN
  if (!user) return <Login setUser={setUser} />;

  // Calculate overall stats for the dashboard
  const totalTracked = myGroups.reduce((sum, g) => sum + (g.totalAmount || 0), 0);
  const totalPeople = [...new Set(myGroups.flatMap(g => g.members))].length;
  const totalGroups = myGroups.length;

  return (
    <div className="layout-container">
      {/* TOP NAV */}
      <nav className="top-nav">
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div className="nav-brand-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="nav-brand-text">
            <h2>Splitly</h2>
            <p>Split smart, settle easy</p>
          </div>
        </div>
        <div className="nav-actions">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      
      <div className="main-content">
        {activeTab === 'dashboard' && (
          <>
            {/* HERO SECTION */}
            <div className="hero-section">
              <div className="hero-content">
                <h1>Split expenses without the awkward math.</h1>
                <p>Track shared costs across trips, roommates, and friend groups. Get instant balances and AI-powered insights.</p>
                <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
                  + New Group
                </button>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{color: '#10b981'}}>💵</div>
                <div className="stat-value">₹{totalTracked}</div>
                <div className="stat-label">Total tracked</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{color: '#3b82f6'}}>👥</div>
                <div className="stat-value">{totalPeople}</div>
                <div className="stat-label">People</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{color: '#f97316'}}>🟠</div>
                <div className="stat-value">{totalGroups}</div>
                <div className="stat-label">Groups</div>
              </div>
            </div>

            {/* YOUR GROUPS */}
            <div>
              <div className="section-header">
                <h2 className="section-title">Your groups</h2>
                <button className="btn-outline" onClick={() => setIsModalOpen(true)}>+ New group</button>
              </div>

              <div className="group-grid">
                {myGroups.map(g => (
                  <div key={g._id || g.name} className="group-card" onClick={() => handleGroupClick(g.name)}>
                    <div className="group-card-header">
                      <div className="group-emoji">{g.emoji || '🌴'}</div>
                      <div className="group-info">
                        <h3>{g.name}</h3>
                        <p>{g.members?.length || 0} members • {g.totalExpenses || 0} expenses</p>
                      </div>
                      <div style={{marginLeft: 'auto', color: '#cbd5e1'}}>→</div>
                    </div>
                    
                    <div className="group-stats">
                      <div className="group-stat-item">
                        <p>Total spent</p>
                        <b>₹{g.totalAmount || 0}</b>
                      </div>
                      <div className="group-stat-item" style={{textAlign: 'right'}}>
                        <p>{(g.netOwe || 0) > 0 ? "You owe" : "You're owed"}</p>
                        <b className={(g.netOwe || 0) > 0 ? 'negative' : 'positive'}>
                          ₹{Math.abs(g.netOwe || 0)}
                        </b>
                      </div>
                    </div>
                  </div>
                ))}

                {myGroups.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                    <p style={{ color: '#64748b', marginBottom: '16px' }}>You aren't part of any groups yet.</p>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Create your first group</button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'group-details' && groupId && (
          <>
            {(() => {
              const currentGroup = myGroups.find(g => g.name === groupId);
              const members = currentGroup?.members || [];
              const totalAmount = currentGroup?.totalAmount || 0;
              
              // Compute balances locally (case-insensitive)
              const balances = {};
              const nameMap = {};
              members.forEach(m => {
                balances[m.toLowerCase()] = 0;
                nameMap[m.toLowerCase()] = m;
              });
              expenses.forEach(e => {
                const paidBy = e.paidBy.toLowerCase();
                if (!nameMap[paidBy]) nameMap[paidBy] = e.paidBy;
                balances[paidBy] = (balances[paidBy] || 0) + e.amount;
                
                e.splitAmong.forEach(s => {
                  const splitName = s.name.toLowerCase();
                  if (!nameMap[splitName]) nameMap[splitName] = s.name;
                  balances[splitName] = (balances[splitName] || 0) - s.amount;
                });
              });

              return (
                <div>
                  <button className="btn-outline" style={{ marginBottom: '24px' }} onClick={() => setActiveTab('dashboard')}>
                    ← Back
                  </button>

                  <div className="group-details-header">
                    <div className="group-details-icon">{currentGroup?.emoji || '🌴'}</div>
                    <div className="group-details-info">
                      <h1>{groupId}</h1>
                      <p>{members.length} members · ₹{totalAmount.toFixed(2)} total</p>
                    </div>
                  </div>

                  <div className="two-col-layout">
                    {/* BALANCES COLUMN */}
                    <div className="balances-card">
                      <div className="card-header-title">Balances</div>
                      {Object.keys(balances).map(mKey => {
                        const bal = balances[mKey] || 0;
                        const m = nameMap[mKey];
                        const isPositive = bal > 0.01;
                        const isNegative = bal < -0.01;
                        return (
                          <div className="balance-row" key={mKey}>
                            <span>{mKey === user?.name?.toLowerCase() ? "You" : m}</span>
                            <span style={{ 
                              color: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#64748b' 
                            }}>
                              {isPositive ? '+' : isNegative ? '-' : ''}₹{Math.abs(bal).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* SETTLE UP COLUMN */}
                    <div className="settle-card">
                      <div className="card-header-title">Settle Up</div>
                      {settlements.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>All settled up!</p>
                      ) : (
                        settlements.map((s, idx) => {
                          const handleSettlePayment = async () => {
                            if (window.confirm(`Mark ₹${s.amount.toFixed(2)} payment from ${s.from} to ${s.to} as settled?`)) {
                              try {
                                await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/expenses/add`, {
                                  groupId: groupId,
                                  title: "Settlement Payment",
                                  amount: s.amount,
                                  category: "General",
                                  paidBy: s.from,
                                  members: members,
                                  splitBetween: [s.to]
                                });
                                fetchData();
                              } catch (err) {
                                console.error("Error marking as settled", err);
                              }
                            }
                          };

                          return (
                            <div className="settle-row" key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>
                                {s.from === user?.name ? "You" : s.from} 
                                <span style={{ color: '#94a3b8', margin: '0 8px' }}>→</span> 
                                {s.to === user?.name ? "You" : s.to}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#10b981', fontWeight: '700' }}>₹{s.amount.toFixed(2)}</span>
                                <button 
                                  onClick={handleSettlePayment}
                                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Mark Settled
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* EXPENSES SECTION */}
                  <div className="expenses-header">
                    <h2>Expenses</h2>
                    <button className="btn-primary" onClick={() => setIsAddExpenseModalOpen(true)}>
                      + Add expense
                    </button>
                  </div>

                  <div className="expenses-list">
                    {expenses.filter(e => e.title !== "Settlement Payment" || (e.splitAmong[0] && e.paidBy.toLowerCase() !== e.splitAmong[0].name.toLowerCase())).length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>No expenses yet</p>
                    ) : (
                      expenses
                        .filter(e => e.title !== "Settlement Payment" || (e.splitAmong[0] && e.paidBy.toLowerCase() !== e.splitAmong[0].name.toLowerCase()))
                        .map((e) => (
                          e.title === "Settlement Payment" ? (
                            <div key={e._id} className="expense-item" style={{ background: '#f8fafc' }}>
                              <div className="expense-item-left">
                                <div className="expense-cat-icon" style={{ background: '#e2e8f0' }}>✅</div>
                                <div className="expense-item-info">
                                  <h4>Payment</h4>
                                  <p>{e.paidBy.toLowerCase() === user?.name?.toLowerCase() ? "You" : e.paidBy} paid {e.splitAmong[0]?.name.toLowerCase() === user?.name?.toLowerCase() ? "You" : e.splitAmong[0]?.name}</p>
                                </div>
                              </div>
                              <div className="expense-item-amount" style={{ color: '#10b981' }}>₹{e.amount.toFixed(2)}</div>
                            </div>
                          ) : (
                            <div key={e._id} className="expense-item">
                              <div className="expense-item-left">
                                <div className="expense-cat-icon">
                                  {e.category === "Food" ? "🍔" : e.category === "Lodging" ? "🏠" : e.category === "Transport" ? "🚗" : "💸"}
                                </div>
                                <div className="expense-item-info">
                                  <h4>{e.title}</h4>
                                  <p>{e.paidBy.toLowerCase() === user?.name?.toLowerCase() ? "You" : e.paidBy} paid · split {e.splitAmong.length} ways</p>
                                </div>
                              </div>
                              <div className="expense-item-amount">₹{e.amount.toFixed(2)}</div>
                            </div>
                          )
                      ))
                    )}
                  </div>

                  <AddExpenseModal 
                    isOpen={isAddExpenseModalOpen} 
                    onClose={() => setIsAddExpenseModalOpen(false)}
                    user={user}
                    groupId={groupId}
                    members={members}
                    onExpenseAdded={fetchData}
                  />
                </div>
              );
            })()}
          </>
        )}

      {/* 🤖 AI CHATBOT */}
      <Chatbot groupId={groupId || (myGroups.length > 0 ? myGroups[0].name : "General")} />
      </div>

      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user}
        onGroupCreated={fetchData}
      />
    </div>
  );
}

export default App;