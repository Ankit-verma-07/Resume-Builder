import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Feedback from './Feedback';

function Home() {
  const navigate = useNavigate();
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('loggedIn') === 'true' ||
    sessionStorage.getItem('loggedIn') === 'true'
  );

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const handleUserChange = () => {
      setIsLoggedIn(
        localStorage.getItem('loggedIn') === 'true' ||
        sessionStorage.getItem('loggedIn') === 'true'
      );
    };
    window.addEventListener('userChange', handleUserChange);
    return () => window.removeEventListener('userChange', handleUserChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleLogoutClick = () => {
    if (isLoggedIn) {
      setShowConfirmPopup(true);
    } else {
      setShowLoginPopup(true);
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('userInfo');
    window.dispatchEvent(new Event("userChange"));
    setShowConfirmPopup(false);
    navigate('/');
  };

  return (
    <div>
      <div className="home-bg-animation"></div>

      <div className="theme-toggle-container">
        <label className="theme-switch">
          <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <span className="slider">
            <span className="icon">{darkMode ? '🌙' : '☀️'}</span>
          </span>
        </label>
      </div>

      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            Resume<span className="highlight">Builder</span>
          </div>
          <div className="navbar-links">
            <input
              type="text"
              placeholder="Search..."
              className="navbar-search"
              onChange={(e) => console.log(e.target.value)}
            />
            {!isLoggedIn && (
              <button className="btn-grad" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
            <button
              className="btn-grad"
              onClick={() => {
                if (isLoggedIn) setShowFeedbackModal(true);
                else setShowLoginPopup(true);
              }}
            >
              Feedback
            </button>
            <button className="btn-grad" onClick={() => navigate('/about')}>
              About
            </button>
            {isLoggedIn && (
              <button className="btn-grad" onClick={handleLogoutClick}>
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="home-main fade-container">
        <div className="home-content">
          <div className="home-text">
            <h1 className="fade-in">Welcome to Resume Builder</h1>
            <p className="fade-in">
              Create multilingual resumes easily with drag-and-drop interface
              and beautiful templates.
            </p>
            <ul
              className="fade-in"
              style={{
                listStyle: 'none',
                padding: 0,
                textAlign: 'left',
                maxWidth: '600px',
                marginBottom: '32px',
                color: darkMode ? '#ccc' : '#222',
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            >
              <li>✅ Easy drag-and-drop editor</li>
              <li>✅ Professionally designed templates</li>
              <li>✅ Support for multiple languages</li>
              <li>✅ Download as PDF or share online</li>
            </ul>

            <button
              onClick={() => navigate('/resume-builder')}
              className="btn-grad"
              style={{ marginTop: '20px' }}
            >
              Get Started
            </button>
          </div>

          <div className="home-illustration fade-in">
            <img
              src="/Logos/undraw_online-resume_z4sp.svg"
              alt="Resume Illustration"
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="features-section fade-container">
        <h2 className="fade-in">Why Choose ResumeBuilder?</h2>
        <div className="features-content">
          <div className="feature-cards fade-in">
            <div className="feature-card">
              <h3>📄 PDF Export</h3>
              <p>Download your resume in high-quality PDF format or share a live link.</p>
            </div>
            <div className="feature-card">
              <h3>💡 Easy to Use</h3>
              <p>Simple drag-and-drop interface for effortless editing.</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Fast & Professional</h3>
              <p>Build polished resumes quickly without compromising quality.</p>
            </div>
            <div className="feature-card">
              <h3>💾 Auto Save</h3>
              <p>Your progress is saved automatically as you go.</p>
            </div>
          </div>
          <div className="features-image fade-in">
            <img src="/Logos/undraw_preferences-popup_ibw8.svg" alt="Features Illustration" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section fade-container">
        <h2 className="fade-in">How It Works</h2>
        <div className="how-it-works-steps">
          <div className="step-card fade-in">
            <h3>1️⃣ Choose a Template</h3>
            <p>Select from a wide variety of professional templates tailored to your industry.</p>
          </div>
          <div className="step-card fade-in">
            <h3>2️⃣ Fill Your Information</h3>
            <p>Enter your details in our easy-to-use, guided editor with AI suggestions.</p>
          </div>
          <div className="step-card fade-in">
            <h3>3️⃣ Customize & Preview</h3>
            <p>Rearrange sections, update styles, and preview the final design instantly.</p>
          </div>
          <div className="step-card fade-in">
            <h3>4️⃣ Download or Share</h3>
            <p>Export your resume as PDF or share a live link with recruiters.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonial-section fade-container">
        <h2 className="fade-in">What Users Say</h2>
        <div className="testimonial-content">
          <div className="testimonial-cards fade-in">
            <div className="testimonial-card">
              <p>“This builder helped me create a professional resume in minutes!”</p>
              <h4>- Ankit Sharma</h4>
            </div>
            <div className="testimonial-card">
              <p>“I love the auto-save and templates. Super fast and easy.”</p>
              <h4>- Priya Mehta</h4>
            </div>
            <div className="testimonial-card">
              <p>“Clean UI and smart suggestions — just what I needed.”</p>
              <h4>- Rahul Desai</h4>
            </div>
          </div>
          <div className="testimonial-image fade-in">
            <img src="/Logos/undraw_reviews_ukai.svg" alt="Testimonials Illustration" />
          </div>
          <div className="testimonial-image fade-in">
            <img src="/Logos/undraw_testimonials_4c7y.svg" alt="Testimonials Illustration" />
          </div>
        </div>
      </section>

      {/* Confirm Logout Popup */}
      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>Are you sure you want to logout?</p>
            <div className="popup-buttons">
              <button onClick={confirmLogout}>Yes</button>
              <button onClick={() => setShowConfirmPopup(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Login required Popup */}
      {showLoginPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>You need to login first.</p>
            <div className="popup-buttons">
              <button onClick={() => setShowLoginPopup(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <Feedback
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li onClick={() => navigate('/')}>Home</li>
              <li onClick={() => navigate('/about')}>About</li>
              <li onClick={() => {
                if(isLoggedIn) setShowFeedbackModal(true);
                else setShowLoginPopup(true);
              }}>Feedback</li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Contact Us</h3>
            <p>Email: support@resumebuilder.com</p>
            <p>Location: India</p>
          </div>

          <div className="footer-column">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#"><i className="fab fa-linkedin"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 ResumeBuilder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
