import React, { useEffect, useState } from 'react';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/api/users');
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
      const res = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        setMessage('Error parsing response');
        return;
      }
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
      const res = await fetch('http://localhost:5000/api/users', { method: 'DELETE' });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        setMessage('Error parsing response');
        return;
      }
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

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Admin: Registered Users</h2>
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
