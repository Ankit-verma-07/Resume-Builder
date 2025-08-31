
import React, { useEffect, useState } from "react";
function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ✅ Load user info from storage (localStorage/sessionStorage)
    const storedUser = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src="/Logos/profile.png" // ✅ Replace with a profile avatar image
          alt="Profile"
          style={styles.avatar}
        />
        <h2 style={styles.name}>{user || "Guest User"}</h2>
        <p style={styles.email}>{user ? `${user}@example.com` : "guest@example.com"}</p>

        <div style={styles.buttons}>
          <button style={styles.btn}>Edit Profile</button>
          <button style={{ ...styles.btn, background: "#ff4d4d" }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    padding: "30px",
    width: "320px",
    textAlign: "center",
    color: "#fff",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "3px solid #fff",
    marginBottom: "15px",
  },
  name: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  email: {
    fontSize: "14px",
    opacity: 0.9,
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  btn: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(45deg, #00c6ff, #0072ff)",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Profile;
