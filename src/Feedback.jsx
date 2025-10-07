import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Feedback.css";

function Feedback({ show, onClose }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false); // ✅ New state

  // ✅ Stateful login check
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true" ||
    sessionStorage.getItem("loggedIn") === "true"
  );

  // ✅ Listen to login/logout events
  useEffect(() => {
    const handleUserChange = () => {
      setIsLoggedIn(
        localStorage.getItem("loggedIn") === "true" ||
        sessionStorage.getItem("loggedIn") === "true"
      );
    };
    window.addEventListener("userChange", handleUserChange);
    return () => window.removeEventListener("userChange", handleUserChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    const userInfo =
      JSON.parse(localStorage.getItem("userInfo")) ||
      JSON.parse(sessionStorage.getItem("userInfo"));

    if (!userInfo || !userInfo._id) {
      setStatus("User info missing. Please login again.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("http://localhost:5001/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userInfo._id,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("Feedback submitted successfully!");
        setMessage("");

        // ✅ Show floating Thank You
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 2000); // disappear after 2s
      } else {
        setStatus(data.error || "Failed to submit feedback");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setStatus(
        "Cannot reach server. Please make sure backend is running and CORS is enabled."
      );
    }

    setIsSubmitting(false);
  };

  if (!show) return null;

  return (
    <div className="feedback-overlay">
      <div className="feedback-box">
        <button className="feedback-close" onClick={onClose}>
          &times;
        </button>
        <h2>Feedback</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter your feedback..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <div className="loader"></div> : "Submit Feedback"}
          </button>
        </form>
        {status && <p className="status-message">{status}</p>}

        {/* ✅ Floating Thank You */}
        {showThankYou && <div className="thank-you">Thank You!</div>}

        {/* Login required popup inside modal */}
        {showLoginPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <p>You need to login first to give feedback.</p>
              <div className="popup-buttons">
                <button
                  onClick={() => {
                    setShowLoginPopup(false);
                    onClose(); // Close feedback modal
                    navigate("/login");
                  }}
                >
                  Login
                </button>
                <button onClick={() => setShowLoginPopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feedback;
