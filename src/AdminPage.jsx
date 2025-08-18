import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5001/api/users'); // ✅ make sure matches backend port
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loggedIn');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('loggedIn');
    navigate('/login'); // redirect to login page
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin: Registered Users</h2>
        <button onClick={handleLogout} style={{ backgroundColor: '#646cff', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <button onClick={handleDeleteAll} style={{ marginBottom: 16, color: 'red' }}>Delete All Users</button>
      {message && <div style={{ color: 'green', marginBottom: 10 }}>{message}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 8, color: 'black' }}>Name</th>
              <th style={{ border: '1px solid #ccc', padding: 8, color: 'black' }}>Email</th>
              <th style={{ border: '1px solid #ccc', padding: 8, color: 'black' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: 8, color: 'black' }}>{user.name}</td>
                <td style={{ border: '1px solid #ccc', padding: 8, color: 'black' }}>{user.email}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  <button onClick={() => handleDelete(user.email)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminPage;
