import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css'; // import the CSS

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'feedback' | 'resumes'
  const [resumes, setResumes] = useState([]);
  const [resumeJsons, setResumeJsons] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '', fontFamily: 'Arial, sans-serif', fontSize: 14, fontColor: '#222', headingColor: '#4a90e2', accentColor: '#4a90e2', textAlign: 'left', headingFontSize: 20, backgroundColor: '#ffffff',
    sectionStyles: {}
  });
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  // Prevent browser back navigation for admin while logged in
  useEffect(() => {
    const isAdmin = (sessionStorage.getItem('userInfo') && JSON.parse(sessionStorage.getItem('userInfo')).role === 'admin') || (localStorage.getItem('userInfo') && JSON.parse(localStorage.getItem('userInfo')).role === 'admin') || sessionStorage.getItem('isAdmin') === 'true' || localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) return; // only apply when admin is logged in

    // Push a dummy state so back button won't leave the admin page
    try {
      window.history.pushState({ adminLocked: true }, '');
    } catch (e) {
      // ignore browsers that disallow pushState
    }

    const onPop = (e) => {
      // If user tries to go back while admin is logged in, push them forward again
      try {
        window.history.pushState({ adminLocked: true }, '');
      } catch (err) {}
    };

    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Clean up the dummy history state when leaving admin page
      try {
        // replace the current history entry so the dummy doesn't persist
        window.history.replaceState({}, '');
      } catch (e) {}
    };
  }, []);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/users');
      const data = await res.json();
  setUsers(data.users || []);
    } catch (err) {
      setMessage('Failed to fetch users: ' + err.message);
    }
    setLoading(false);
  };

  const fetchResumes = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/user-resumes');
      const data = await res.json();
      setResumes(data.items || []);
    } catch (err) {
      console.warn('Failed to fetch resumes', err);
    }
  };

  const fetchResumeJsons = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/resumes');
      const data = await res.json();
      setResumeJsons(data.resumes || []);
    } catch (err) {
      console.warn('Failed to fetch resume JSONs', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.warn('Failed to fetch templates', err);
    }
  };

  const createTemplate = async () => {
    setMessage('');
    // client-side validation
    if (!newTemplate.name || newTemplate.name.trim().length === 0) {
      setMessage('Please provide a template name');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      // Read text and attempt to parse JSON (avoids double-reading the body stream)
      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Unexpected response (HTTP ${res.status}): ${text.substring(0, 400)}`);
        }
      }

      if (res.ok) {
        setMessage('Template created');
        setNewTemplate({ name: '', fontFamily: 'Arial, sans-serif', fontSize: 14, fontColor: '#222', headingColor: '#4a90e2', accentColor: '#4a90e2', textAlign: 'left', headingFontSize: 20, backgroundColor: '#ffffff' });
        fetchTemplates();
      } else {
        setMessage(data.error || `Failed to create template (HTTP ${res.status})`);
      }
    } catch (err) {
      setMessage('Network error: ' + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    // preload resumes count so the card value is correct on first render
    fetchResumes();
    // preload resume JSONs so 'User Resume Data' count is accurate
    fetchResumeJsons();
  }, []);

  // Delete single user
  const handleDelete = async (email) => {
    setMessage('');
    try {
      const res = await fetch(`http://localhost:5001/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('User deleted');
        fetchUsers();
      } else {
        setMessage(data.error || 'Delete failed');
      }
    } catch (err) {
      setMessage('Network error: ' + err.message);
    }
  };

  // Delete all users
  const handleDeleteAll = async () => {
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/users', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage('All users deleted');
        fetchUsers();
      } else {
        setMessage(data.error || 'Delete all failed');
      }
    } catch (err) {
      setMessage('Network error: ' + err.message);
    }
  };

  // Logout handler
  const handleLogout = () => {
    // show confirmation dialog instead of immediate logout
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Perform actual logout
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('userInfo');

    try {
      window.history.replaceState({}, '');
    } catch (e) {}

    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="header-actions">
          <button className="delete-all-btn" onClick={handleDeleteAll}>Delete All Users</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <div className={`card ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); fetchUsers(); }}>
          <div className="card-title">Registered Users</div>
          <div className="card-value">{users.length}</div>
        </div>

        <div className={`card ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => { setActiveTab('feedback'); fetchUsers(); }}>
          <div className="card-title">User Feedback</div>
          <div className="card-value">{
            users.reduce((sum, u) => sum + (u.feedbacks ? u.feedbacks.length : 0), 0)
          }</div>
        </div>

        <div className={`card ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => { setActiveTab('resumes'); fetchResumes(); }}>
          <div className="card-title">User Resumes</div>
          <div className="card-value">{resumes.length}</div>
        </div>

        <div className={`card ${activeTab === 'resumeData' ? 'active' : ''}`} onClick={() => { setActiveTab('resumeData'); fetchResumeJsons(); }}>
          <div className="card-title">User Resume Data</div>
          <div className="card-value">{resumeJsons.length}</div>
        </div>

        <div className={`card ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => { setActiveTab('templates'); fetchTemplates(); }}>
          <div className="card-title">Manage Templates</div>
          <div className="card-value">{templates.length}</div>
        </div>
      </div>

      {message && <div className="status-message">{message}</div>}

      {/* Conditional content based on activeTab */}
      {activeTab === 'users' && (
        loading ? <div>Loading...</div> : (
          <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Password</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td data-label="Name">{user.name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Username">{user.username}</td>
                <td data-label="Password">{user.password}</td>
                <td data-label="Action">
                  <button className="delete-btn" onClick={() => handleDelete(user.email)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        )
      )}

      {activeTab === 'feedback' && (
        loading ? <div>Loading...</div> : (
          <div className="feedback-section">
            {users.map((user) => (
              <div key={user._id} className="user-feedback-block">
                <h4>{user.username || user.name} - {user.email}</h4>
                {user.feedbacks && user.feedbacks.length > 0 ? (
                  <div className="feedback-list">
                    {user.feedbacks.map((fb) => (
                      <div className="feedback-card" key={fb._id || fb.createdAt || Math.random()}>
                        <div className="feedback-message">{fb.message}</div>
                        <div className="feedback-timestamp">{fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                ) : <div>No feedback</div>}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'resumes' && (
        <div className="resumes-section">
          {resumes.length === 0 ? <div>No resumes found</div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(r => (
                  <tr key={r._id}>
                      <td data-label="User">{r.username}</td>
                      <td data-label="Email">{r.email}</td>
                      <td data-label="Created At">{new Date(r.createdAt).toLocaleString()}</td>
                      <td data-label="Preview">
                      {r.fileId ? (
                        <button className="view-resume-btn" onClick={() => window.open(`http://localhost:5001/api/user-resume/${r.fileId}`, '_blank')}>See resume</button>
                      ) : (
                        <button className="view-resume-btn" onClick={() => alert('No binary resume stored for this entry')}>No file</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'resumeData' && (
        <div className="resume-data-section">
          {resumeJsons.length === 0 ? <div>No resume JSONs found</div> : (
            <div style={{ display: 'grid', gap: 12 }}>
              {resumeJsons.map(r => {
                const data = r.data || {};
                return (
                <div key={r._id} className="resume-card">
                  <div className="resume-header">
                    <div className="resume-name">{r.username || r.email || (data.personalInfo && (data.personalInfo.name || data.personalInfo.fullName)) || 'Unknown'}</div>
                    <div className="resume-timestamp">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>

                  {data.personalInfo && (
                    <div className="resume-section personal-info">
                      <div className="resume-section-title">Personal Info</div>
                      <div className="resume-kv">
                        {Object.entries(data.personalInfo).map(([k,v]) => (<div key={k} className="kv-row"><span className="kv-key">{k}</span><span className="kv-val">{String(v)}</span></div>))}
                      </div>
                    </div>
                  )}

                  {data.experiences && data.experiences.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title">Experiences</div>
                      <div className="resume-list">
                        {data.experiences.map((exp, i) => (
                          <div className="resume-item" key={i}>
                            <div className="item-title">{exp.title || exp.position || 'Experience'}</div>
                            <div className="item-sub">{exp.company || exp.organization || ''}</div>
                            {exp.description && <div className="item-desc">{exp.description}</div>}
                            {(exp.startDate || exp.endDate) && <div className="item-date">{exp.startDate || ''} {exp.endDate ? ` - ${exp.endDate}` : ''}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.educations && data.educations.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title">Educations</div>
                      <div className="resume-list">
                        {data.educations.map((ed, i) => (
                          <div className="resume-item" key={i}><div className="item-title">{ed.degree || ed.institution}</div><div className="item-sub">{ed.institution}</div><div className="item-date">{ed.startDate || ''} {ed.endDate ? ` - ${ed.endDate}` : ''}</div></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.projects && data.projects.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title">Projects</div>
                      <div className="resume-list">
                        {data.projects.map((p, i) => (<div className="resume-item" key={i}><div className="item-title">{p.name}</div><div className="item-desc">{p.description}</div></div>))}
                      </div>
                    </div>
                  )}

                  {data.skills && data.skills.length > 0 && (
                    <div className="resume-section">
                      <div className="resume-section-title">Skills</div>
                      <div className="resume-kv">{data.skills.join(', ')}</div>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="templates-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Templates</h3>
            <div>
              <button className="btn-grad" onClick={() => { setShowTemplateForm(!showTemplateForm); }}>{showTemplateForm ? 'Close' : 'Create Template'}</button>
            </div>
          </div>

          {showTemplateForm && (
            <div className="template-form" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Name</label>
                  <input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                </div>
                <div>
                  <label>Font Family</label>
                  <select value={newTemplate.fontFamily} onChange={(e) => setNewTemplate({ ...newTemplate, fontFamily: e.target.value })}>
                    <option>Arial, sans-serif</option>
                    <option>Georgia, serif</option>
                    <option>Times New Roman, serif</option>
                    <option>Roboto, sans-serif</option>
                    <option>Open Sans, sans-serif</option>
                    <option>Montserrat, sans-serif</option>
                    <option>Tahoma, Geneva, sans-serif</option>
                  </select>
                </div>
                <div>
                  <label>Font Size (px)</label>
                  <div className="small-input-container"><input className="small-input" type="number" value={newTemplate.fontSize} onChange={(e) => setNewTemplate({ ...newTemplate, fontSize: Number(e.target.value) })} /><span className="input-suffix">px</span></div>
                </div>
                <div>
                  <label>Heading Font Size (px)</label>
                  <div className="small-input-container"><input className="small-input" type="number" value={newTemplate.headingFontSize} onChange={(e) => setNewTemplate({ ...newTemplate, headingFontSize: Number(e.target.value) })} /><span className="input-suffix">px</span></div>
                </div>
                <div>
                  <label>Font Color</label>
                  <input type="color" value={newTemplate.fontColor} onChange={(e) => setNewTemplate({ ...newTemplate, fontColor: e.target.value })} />
                </div>
                <div>
                  <label>Heading Color</label>
                  <input type="color" value={newTemplate.headingColor} onChange={(e) => setNewTemplate({ ...newTemplate, headingColor: e.target.value })} />
                </div>
                <div>
                  <label>Accent Color</label>
                  <input type="color" value={newTemplate.accentColor} onChange={(e) => setNewTemplate({ ...newTemplate, accentColor: e.target.value })} />
                </div>
                <div>
                  <label>Background Color</label>
                  <input type="color" value={newTemplate.backgroundColor} onChange={(e) => setNewTemplate({ ...newTemplate, backgroundColor: e.target.value })} />
                </div>
                <div>
                  <label>Text Align</label>
                  <select value={newTemplate.textAlign} onChange={(e) => setNewTemplate({ ...newTemplate, textAlign: e.target.value })}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label>Profile Border Color</label>
                  <input type="color" value={newTemplate.profileBorderColor || '#4a90e2'} onChange={(e) => setNewTemplate({ ...newTemplate, profileBorderColor: e.target.value })} />
                </div>
              </div>
              {/* Per-section style controls */}
              <div style={{ marginTop: 14 }}>
                <h4 style={{ marginBottom: 8 }}>Per-section Styles</h4>
                {['personal','about','education','experience','skills','projects'].map(section => (
                  <div key={section} style={{ marginBottom: 10, borderRadius: 8, padding: 8, border: '1px solid #eef', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ textTransform: 'capitalize' }}>{section}</strong>
                      <button className="btn-ghost" onClick={() => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))}>{openSections[section] ? 'Hide' : 'Edit'}</button>
                    </div>
                    {openSections[section] && (
                      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label>Font Size</label>
                          <div className="small-input-container"><input className="small-input" type="number" value={(newTemplate.sectionStyles[section] && newTemplate.sectionStyles[section].fontSize) || newTemplate.fontSize} onChange={(e) => setNewTemplate({ ...newTemplate, sectionStyles: { ...newTemplate.sectionStyles, [section]: { ...newTemplate.sectionStyles[section], fontSize: Number(e.target.value) } } })} /><span className="input-suffix">px</span></div>
                        </div>
                        <div>
                          <label>Heading Size</label>
                          <div className="small-input-container"><input className="small-input" type="number" value={(newTemplate.sectionStyles[section] && newTemplate.sectionStyles[section].headingSize) || newTemplate.headingFontSize} onChange={(e) => setNewTemplate({ ...newTemplate, sectionStyles: { ...newTemplate.sectionStyles, [section]: { ...newTemplate.sectionStyles[section], headingSize: Number(e.target.value) } } })} /><span className="input-suffix">px</span></div>
                        </div>
                        <div>
                          <label>Font Color</label>
                          <input type="color" value={(newTemplate.sectionStyles[section] && newTemplate.sectionStyles[section].fontColor) || newTemplate.fontColor} onChange={(e) => setNewTemplate({ ...newTemplate, sectionStyles: { ...newTemplate.sectionStyles, [section]: { ...newTemplate.sectionStyles[section], fontColor: e.target.value } } })} />
                        </div>
                        <div>
                          <label>Text Align</label>
                          <select value={(newTemplate.sectionStyles[section] && newTemplate.sectionStyles[section].textAlign) || newTemplate.textAlign} onChange={(e) => setNewTemplate({ ...newTemplate, sectionStyles: { ...newTemplate.sectionStyles, [section]: { ...newTemplate.sectionStyles[section], textAlign: e.target.value } } })}>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button className="btn-grad" onClick={createTemplate}>Finish Template</button>
                <button className="btn-grad" onClick={() => setShowTemplateForm(false)} style={{ backgroundColor: '#ccc' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            {templates.length === 0 ? <div>No templates yet</div> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created At</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t._id}>
                      <td>{t.name}</td>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                      <td><div style={{ padding: 8, borderRadius: 4, background: t.backgroundColor, color: t.fontColor, fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, textAlign: t.textAlign }}>{t.name} preview</div></td>
                      <td>
                        <button className="delete-btn" onClick={async () => {
                          if (!confirm('Delete this template?')) return;
                          try {
                            const res = await fetch(`http://localhost:5001/api/templates/${t._id}`, { method: 'DELETE' });
                            if (res.ok) {
                              fetchTemplates();
                            } else {
                              const d = await res.json();
                              setMessage(d.error || 'Delete failed');
                            }
                          } catch (e) { setMessage('Network error: ' + e.message); }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="btn-grad" onClick={confirmLogout}>Yes</button>
              <button className="btn-ghost" onClick={cancelLogout}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
