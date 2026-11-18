import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE } from '../api';
import { committees } from '../committees';
import { formatDateRange } from '../eventUtils';
import FeedbackList from '../components/FeedbackList';
import './StudentDashboard.css';
import './TeacherDashboard.css';
import './AdminDashboard.css';

const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const committeeName = (id) => committees.find(c => c.id === id)?.name || id;
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A1.875 1.875 0 0 1 18 22.5h-12a1.875 1.875 0 0 1-1.499-2.382Z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('approvals');

  const [users, setUsers] = useState([]);
  const [approvals, setApprovals] = useState({ expenses: [], sponsorships: [], unread: { expenses: 0, sponsorships: 0 } });
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // approvals
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  // accounts
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [newCommittee, setNewCommittee] = useState(committees[0].id);
  const [userMsg, setUserMsg] = useState({ type: '', text: '' });

  // events + feedback
  const [feedbackEvent, setFeedbackEvent] = useState('all');
  const feedbackRef = useRef(null);

  // announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  // messages
  const [chatCommittee, setChatCommittee] = useState(committees[0].id);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatCommitteeRef = useRef(chatCommittee);

  const loadAll = useCallback(async () => {
    try {
      const [u, a, e, n] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/users`, authConfig()),
        axios.get(`${API_BASE}/api/admin/approvals`, authConfig()),
        axios.get(`${API_BASE}/api/admin/events`, authConfig()),
        axios.get(`${API_BASE}/api/announcements`),
      ]);
      setUsers(u.data);
      setApprovals(a.data);
      setEvents(e.data);
      setAnnouncements(n.data);
    } catch (err) {
      console.error('Error loading admin data', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---------- accounts ----------
  const faculty = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserMsg({ type: '', text: '' });
    try {
      await axios.post(
        `${API_BASE}/api/admin/users`,
        { username: newUsername, password: newPassword, role: newRole, committee: newCommittee },
        authConfig()
      );
      setUserMsg({ type: 'success', text: `Account "${newUsername.trim()}" created.` });
      setNewUsername(''); setNewPassword('');
      loadAll();
    } catch (err) {
      setUserMsg({ type: 'error', text: err.response?.data?.message || 'Could not create the account.' });
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Remove ${u.username}? They will no longer be able to log in.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${u._id}`, authConfig());
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove the account.');
    }
  };

  // ---------- approvals ----------
  const unreadTotal = approvals.unread.expenses + approvals.unread.sponsorships;
  const approvalRows = [
    ...approvals.expenses.map(x => ({
      key: `e-${x._id}`, type: 'expense', id: x._id, label: 'Expense', committee: x.committee,
      title: x.title, amount: x.amount, by: x.user?.username, note: x.adminNote, seen: x.adminSeen,
      link: x.receiptLink, linkText: 'Receipt', when: x.updatedAt, extra: x.category,
    })),
    ...approvals.sponsorships.map(x => ({
      key: `s-${x._id}`, type: 'sponsorship', id: x._id, label: 'Sponsorship', committee: x.committee,
      title: x.companyName, amount: x.amountPledged, by: x.user?.username, note: x.adminNote, seen: x.adminSeen,
      link: x.documentLink, linkText: 'Documents', when: x.updatedAt, extra: x.companyOrigin,
    })),
  ]
    .filter(r => approvalFilter === 'all' || r.committee === approvalFilter)
    .filter(r => !onlyUnread || !r.seen)
    .sort((a, b) => new Date(b.when) - new Date(a.when));

  const markSeen = async (body) => {
    try {
      await axios.put(`${API_BASE}/api/admin/approvals/seen`, body, authConfig());
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- events ----------
  const handleDeleteEvent = async (ev) => {
    if (!window.confirm(`Delete "${ev.name}"${ev.feedbackCount ? ` and its ${ev.feedbackCount} feedback response(s)` : ''}?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/events/${ev._id}`, authConfig());
      if (feedbackEvent === ev._id) setFeedbackEvent('all');
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete the event.');
    }
  };

  const viewFeedback = (id) => {
    setFeedbackEvent(id);
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // ---------- announcements ----------
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setAnnMsg({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/api/announcements`, { title: annTitle, body: annBody }, authConfig());
      setAnnTitle(''); setAnnBody('');
      setAnnMsg({ type: 'success', text: 'Announcement posted as Admin.' });
      loadAll();
    } catch (err) {
      setAnnMsg({ type: 'error', text: err.response?.data?.message || 'Could not post.' });
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE}/api/announcements/${id}`, authConfig());
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete.');
    }
  };

  // ---------- messages ----------
  useEffect(() => { chatCommitteeRef.current = chatCommittee; }, [chatCommittee]);

  useEffect(() => {
    if (activeTab !== 'messages') return undefined;
    let cancelled = false;
    axios.get(`${API_BASE}/api/messages`, { ...authConfig(), params: { committee: chatCommittee } })
      .then(res => {
        if (cancelled) return;
        setChatMessages(res.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .catch(err => console.error('Error fetching messages', err));

    const socket = io(API_BASE, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_committee', chatCommittee));
    socket.on('receive_message', (message) => {
      if (message.committee !== chatCommitteeRef.current) return;
      setChatMessages(prev => (prev.find(m => m._id === message._id) ? prev : [...prev, message]));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => { cancelled = true; socket.disconnect(); };
  }, [activeTab, chatCommittee]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;
    try {
      await axios.post(`${API_BASE}/api/messages`, { text: newChatMessage, committee: chatCommittee }, authConfig());
      setNewChatMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send the message.');
    }
  };

  const tab = (id, label) => (
    <button className={`tab-button ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
      {label}
    </button>
  );

  return (
    <div className="page-container">
      <div className="page-header" data-aos="fade-down">
        <h1>Admin Dashboard</h1>
        <p>Every committee, faculty advisor, student treasurer and approval in one place.</p>
      </div>

      <div className="stat-card-row" data-aos="fade-up">
        <div className="card stat-card">
          <div className="stat-icon blue"><UsersIcon /></div>
          <div className="stat-info">
            <h3>Faculty Advisors</h3>
            <p>{faculty.length}</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon green"><UsersIcon /></div>
          <div className="stat-info">
            <h3>Student Treasurers</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon red"><BellIcon /></div>
          <div className="stat-info">
            <h3>New Approvals</h3>
            <p>{unreadTotal} Unread</p>
          </div>
        </div>
      </div>

      <div className="card" data-aos="fade-up" data-aos-delay="200">
        <div className="dashboard-tabs">
          {tab('approvals', <>Approvals{unreadTotal > 0 && <span className="adm-badge">{unreadTotal}</span>}</>)}
          {tab('committees', 'Committees & Accounts')}
          {tab('events', 'Events & Feedback')}
          {tab('announcements', 'Announcements')}
          {tab('messages', 'Messages')}
        </div>

        <div className="tab-content">

          {/* ---------------- APPROVALS ---------------- */}
          {activeTab === 'approvals' && (
            <>
              <div className="adm-toolbar">
                <select className="adm-select" value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}>
                  <option value="all">All committees</option>
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <label className="adm-check">
                  <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} />
                  Only unread
                </label>
                <button
                  className="btn-action btn-expand adm-push"
                  disabled={unreadTotal === 0}
                  onClick={() => markSeen({ all: true })}
                >
                  Mark all as seen
                </button>
              </div>
              <p className="adm-hint">Expenses and sponsorships the faculty advisors have approved, newest first.</p>

              <div className="transaction-table">
                <table>
                  <thead>
                    <tr>
                      <th>Committee</th><th>Type</th><th>Item</th><th>Amount</th><th>Submitted by</th>
                      <th>Note from faculty</th><th>Approved on</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="8">Loading...</td></tr>}
                    {!loading && approvalRows.length === 0 && <tr><td colSpan="8">Nothing here yet.</td></tr>}
                    {approvalRows.map(r => (
                      <tr key={r.key} className={r.seen ? '' : 'adm-row-unread'}>
                        <td data-label="Committee">{committeeName(r.committee)}</td>
                        <td data-label="Type">
                          {r.label}
                          {!r.seen && <span className="adm-new">NEW</span>}
                        </td>
                        <td data-label="Item">{r.title}<span className="adm-sub">{r.extra}</span></td>
                        <td data-label="Amount">{money(r.amount)}</td>
                        <td data-label="Submitted by">{r.by || 'Removed user'}</td>
                        <td data-label="Note from faculty" className="adm-note">{r.note || <span className="adm-none">No note</span>}</td>
                        <td data-label="Approved on">{shortDate(r.when)}</td>
                        <td className="actions-cell" data-label="Actions">
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="btn-action btn-expand">{r.linkText}</a>
                          {!r.seen && (
                            <button className="btn-action btn-approve" onClick={() => markSeen({ type: r.type, id: r.id })}>
                              Mark seen
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ---------------- COMMITTEES & ACCOUNTS ---------------- */}
          {activeTab === 'committees' && (
            <>
              <div className="adm-section">
                <h3>Create an account</h3>
                <p className="ann-form-sub">Add a faculty advisor or student treasurer to a committee.</p>
                <form onSubmit={handleCreateUser} className="adm-user-form">
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="newCommittee">Committee</label>
                      <select id="newCommittee" value={newCommittee} onChange={e => setNewCommittee(e.target.value)}>
                        {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="newRole">Role</label>
                      <select id="newRole" value={newRole} onChange={e => setNewRole(e.target.value)}>
                        <option value="teacher">Faculty Advisor</option>
                        <option value="student">Student Treasurer</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="newUsername">Username</label>
                      <input id="newUsername" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g., coc-teacher2" required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="newPassword">Password</label>
                      <input id="newPassword" type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 3 characters" required />
                    </div>
                  </div>
                  {userMsg.text && <div className={userMsg.type === 'success' ? 'form-success' : 'form-error'}>{userMsg.text}</div>}
                  <button type="submit" className="btn btn-primary">Create account</button>
                </form>
              </div>

              <div className="adm-section">
                <h3>Who is in each committee</h3>
                <div className="adm-committee-grid">
                  {committees.map(c => {
                    const members = users.filter(u => u.committee === c.id);
                    const fac = members.filter(u => u.role === 'teacher');
                    const stu = members.filter(u => u.role === 'student');
                    const row = (u) => (
                      <li className="adm-member" key={u._id}>
                        <span>{u.username}</span>
                        <button className="btn-delete-ann" title="Remove" onClick={() => handleDeleteUser(u)}><TrashIcon /></button>
                      </li>
                    );
                    return (
                      <div className="adm-committee-card" key={c.id}>
                        <div className="adm-committee-head">
                          <img src={c.logo} alt="" />
                          <h4>{c.name}</h4>
                        </div>
                        <span className="adm-role-label">Faculty advisors ({fac.length})</span>
                        <ul>{fac.length ? fac.map(row) : <li className="adm-none">None yet</li>}</ul>
                        <span className="adm-role-label">Student treasurers ({stu.length})</span>
                        <ul>{stu.length ? stu.map(row) : <li className="adm-none">None yet</li>}</ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ---------------- EVENTS & FEEDBACK ---------------- */}
          {activeTab === 'events' && (
            <>
              <div className="transaction-table">
                <table>
                  <thead>
                    <tr><th>Committee</th><th>Event</th><th>Date</th><th>Feedback</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="5">Loading...</td></tr>}
                    {!loading && events.length === 0 && <tr><td colSpan="5">No events have been posted yet.</td></tr>}
                    {events.map(ev => (
                      <tr key={ev._id}>
                        <td data-label="Committee">{committeeName(ev.committee)}</td>
                        <td data-label="Event">{ev.name}</td>
                        <td data-label="Date">{formatDateRange(ev.date, ev.endDate)}</td>
                        <td data-label="Feedback">
                          {ev.feedbackCount
                            ? `${ev.feedbackCount} · ${ev.averageRating.toFixed(1)} ★`
                            : <span className="adm-none">None yet</span>}
                        </td>
                        <td className="actions-cell" data-label="Actions">
                          <button className="btn-action btn-expand" onClick={() => viewFeedback(ev._id)}>View feedback</button>
                          <button className="btn-action btn-reject" onClick={() => handleDeleteEvent(ev)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="adm-section" ref={feedbackRef}>
                <h3>Feedback received</h3>
                <FeedbackList key={feedbackEvent} url="/api/admin/feedback" initialEvent={feedbackEvent} />
              </div>
            </>
          )}

          {/* ---------------- ANNOUNCEMENTS ---------------- */}
          {activeTab === 'announcements' && (
            <div className="announcements-tab">
              <div className="ann-form-section">
                <h3>Post an announcement as Admin</h3>
                <p className="ann-form-sub">It appears on the public Announcements page, marked as Admin.</p>
                <form onSubmit={handlePostAnnouncement} className="ann-form">
                  <div className="form-group">
                    <label htmlFor="admAnnTitle">Title</label>
                    <input id="admAnnTitle" type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="admAnnBody">Body</label>
                    <textarea id="admAnnBody" value={annBody} onChange={e => setAnnBody(e.target.value)} required />
                  </div>
                  {annMsg.text && <div className={annMsg.type === 'success' ? 'form-success' : 'form-error'}>{annMsg.text}</div>}
                  <button type="submit" className="btn btn-primary">Post Announcement</button>
                </form>
              </div>

              <div className="ann-list-section">
                <h3>All announcements</h3>
                {announcements.length === 0 && <p className="ann-empty">No announcements yet.</p>}
                {announcements.map(a => (
                  <div className="ann-posted-card" key={a._id}>
                    <div className="ann-posted-info">
                      <h4>{a.title}</h4>
                      <span className="ann-posted-date">
                        {shortDate(a.createdAt)} · {a.postedBy?.role === 'admin' ? 'Admin' : committeeName(a.committee)}
                      </span>
                      <p>{a.body}</p>
                    </div>
                    <button className="btn-delete-ann" onClick={() => handleDeleteAnnouncement(a._id)} title="Delete">
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- MESSAGES ---------------- */}
          {activeTab === 'messages' && (
            <div className="form-container messages-container" style={{ display: 'flex', flexDirection: 'column', height: '540px' }}>
              <h2>Committee Messages</h2>
              <select className="adm-select adm-chat-select" value={chatCommittee} onChange={e => { setChatMessages([]); setChatCommittee(e.target.value); }}>
                {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="chat-window" style={{ flex: 1, overflowY: 'auto', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatMessages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No messages yet in this committee.</p>}
                {chatMessages.map((msg, index) => {
                  const isAdmin = msg.sender?.role === 'admin';
                  return (
                    <div
                      key={msg._id || index}
                      className={isAdmin ? 'chat-msg chat-admin' : 'chat-msg'}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        backgroundColor: isAdmin ? '#fdecea' : '#f1f1f1',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        maxWidth: '70%',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: '4px' }}>
                        {isAdmin ? 'ADMIN' : `${msg.sender?.username || 'Removed user'} (${msg.sender?.role || 'user'})`}
                      </strong>
                      <span>{msg.text}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  placeholder={`Message ${committeeName(chatCommittee)} as Admin...`}
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
