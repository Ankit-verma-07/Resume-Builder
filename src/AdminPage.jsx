import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loggedIn');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('loggedIn');
    navigate('/login');
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin: Registered Users</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <button className="delete-all-btn" onClick={handleDeleteAll}>Delete All Users</button>
      {message && <div className="message">{message}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Feedback</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {user.feedbacks && user.feedbacks.length > 0 ? (
                    user.feedbacks.map((fb) => (
                      <div key={fb._id || fb.message + Math.random()}>• {fb.message}</div>
                    ))
                  ) : (
                    'No feedback'
                  )}
                </td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(user.email)}>Delete</button>
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
