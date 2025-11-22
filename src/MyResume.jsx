import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MyResume() {
  const navigate = useNavigate();
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
      // not logged in
      navigate('/login');
      return;
    }

    const userId = stored._id;
    const username = stored.username;
    const email = stored.email;

    setLoading(true);
    // fetch JSON resumes and user-resumes (PDFs) in parallel
    Promise.all([
      fetch('http://localhost:5001/api/resumes').then(r => r.json()).catch(() => ({ resumes: [] })),
      fetch('http://localhost:5001/api/user-resumes').then(r => r.json()).catch(() => ({ items: [] }))
    ]).then(([resJson, resPdf]) => {
      const resumes = resJson.resumes || [];
      const pdfs = resPdf.items || [];

      const hasJson = resumes.some(r => String(r.userId || r.user) === String(userId) || r.username === username || r.email === email);
      setHasJsonResume(!!hasJson);

      // find pdf entry matching username/email
      const pdfMatch = pdfs.find(p => p.userId === userId || p.username === username || p.email === email);
      if (pdfMatch && pdfMatch.fileId) {
        setPdfEntry(pdfMatch);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching resumes', err);
      setMessage('Failed to fetch resume information');
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!hasJsonResume && !pdfEntry) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>No resume found</h2>
        <p>Please create a resume</p>
        <div style={{ marginTop: 12 }}>
          <button className="btn-grad" onClick={() => navigate('/resume-builder')}>Create Resume</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>My Resume</h2>
      {pdfEntry ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <a className="btn-grad" href={`http://localhost:5001/api/user-resume/${pdfEntry.fileId}`} target="_blank" rel="noreferrer">Open PDF</a>
            <a className="btn-ghost" style={{ marginLeft: 12, padding: '10px 12px' }} href={`http://localhost:5001/api/user-resume/${pdfEntry.fileId}`} download>Download PDF</a>
          </div>
          <div style={{ border: '1px solid #e6eefb', borderRadius: 8, overflow: 'hidden' }}>
            <iframe title="resume-pdf" src={`http://localhost:5001/api/user-resume/${pdfEntry.fileId}`} style={{ width: '100%', height: '720px', border: 'none' }} />
          </div>
        </div>
      ) : (
        <div>
          <p>Your resume data exists{hasJsonResume ? ', but a PDF has not been exported yet.' : '.'}</p>
          {hasJsonResume && (
            <div style={{ marginTop: 12 }}>
              <button className="btn-grad" onClick={() => navigate('/resume-builder')}>Open Resume Builder / Export PDF</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyResume;
