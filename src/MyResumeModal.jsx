import React, { useEffect, useState } from 'react';
import ModalWrapper from './ModalWrapper';

function MyResumeModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [pdfEntry, setPdfEntry] = useState(null);
  const [hasJsonResume, setHasJsonResume] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || 'null'); }
      catch (e) { return null; }
    })();
    if (!stored || !stored._id) {
      setMessage('Please login to view your resume');
      setLoading(false);
      return;
    }

    const userId = stored._id;
    const username = stored.username;
    const email = stored.email;

    setLoading(true);
    Promise.all([
      fetch('http://localhost:5001/api/resumes').then(r => r.json()).catch(() => ({ resumes: [] })),
      fetch('http://localhost:5001/api/user-resumes').then(r => r.json()).catch(() => ({ items: [] }))
    ]).then(([resJson, resPdf]) => {
      const resumes = resJson.resumes || [];
      const pdfs = resPdf.items || [];

      const hasJson = resumes.some(r => String(r.userId || r.user) === String(userId) || r.username === username || r.email === email);
      setHasJsonResume(!!hasJson);

      const pdfMatch = pdfs.find(p => (p.userId && String(p.userId) === String(userId)) || p.username === username || p.email === email);
      if (pdfMatch && pdfMatch.fileId) setPdfEntry(pdfMatch);

      // If server didn't yet show the saved resume, fallback to local flag set by builder
      try {
        const last = JSON.parse(localStorage.getItem('lastSavedResume') || 'null');
        if (!hasJson && last && String(last.userId) === String(userId)) {
          setHasJsonResume(true);
        }
      } catch (e) {}

      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching resumes', err);
      setMessage('Failed to fetch resume information');
      // fallback to local flag so recently saved resumes show up immediately
      try {
        const last = JSON.parse(localStorage.getItem('lastSavedResume') || 'null');
        if (last && String(last.userId) === String(userId)) {
          setHasJsonResume(true);
        }
      } catch (e) {}
      setLoading(false);
    });
  }, []);

  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || 'null'); }
    catch (e) { return null; }
  })();
  const username = stored?.username || stored?.email || 'User';

  const containerStyle = pdfEntry
    ? { minWidth: 360, maxWidth: 780, background: '#fff', borderRadius: 12, padding: 18, position: 'relative', color: '#111' }
    : { minWidth: 260, maxWidth: 420, background: '#fff', borderRadius: 12, padding: 12, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' };

  return (
    <ModalWrapper>
      <div style={containerStyle}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : (
          <div>
            {message && <div style={{ color: '#c23', marginBottom: 12 }}>{message}</div>}

            {pdfEntry ? (
              <div>
                <p style={{ marginBottom: 12 }}>Hi <strong>{username}</strong>, your exported PDF resume is available.</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <a className="btn-ghost" style={{ padding: '10px 12px', alignSelf: 'center' }} href={`http://localhost:5001/api/user-resume/${pdfEntry.fileId}`} download>Download PDF</a>
                  <button className="delete-btn" onClick={async () => {
                    if (!confirm('Delete this exported PDF from server? This cannot be undone.')) return;
                    try {
                      const resp = await fetch(`http://localhost:5001/api/user-resume/${pdfEntry._id}`, { method: 'DELETE' });
                      const data = await resp.json().catch(() => ({}));
                      if (!resp.ok) {
                        setMessage(data.error || 'Failed to delete resume');
                        return;
                      }
                      setMessage('Resume deleted');
                      // notify other parts of the app (admin page) to refresh
                      try { window.dispatchEvent(new Event('resumeDeleted')); } catch (e) {}
                      // close modal after deletion
                      setTimeout(() => {
                        onClose();
                      }, 600);
                    } catch (err) {
                      setMessage('Network error: ' + err.message);
                    }
                  }}>Delete</button>
                  <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={onClose}>Close</button>
                </div>
                <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid #eef' }}>
                  <iframe title="resume-pdf" src={`http://localhost:5001/api/user-resume/${pdfEntry.fileId}`} style={{ width: '100%', height: '100%', border: 'none' }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 12 }}>
                <p style={{ fontSize: 18, marginBottom: 8 }}>Hello <strong style={{ fontSize: 18 }}>{username}</strong></p>
                {hasJsonResume ? (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 16 }}>Please create a Resume first.</p>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn-grad" onClick={() => { onClose(); window.location.href = '/resume-builder'; }}>Open Resume Builder / Export PDF</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 18, color: '#444' }}>Please create a resume</p>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn-grad" onClick={() => { onClose(); window.location.href = '/resume-builder'; }}>Create Resume</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

export default MyResumeModal;
