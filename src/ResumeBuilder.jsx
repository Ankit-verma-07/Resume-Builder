import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Home.css';

function ResumeBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  const sectionOrder = ['personal', 'about', 'education', 'experience', 'skills', 'softskills', 'projects', 'template', 'preview'];
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [about, setAbout] = useState('');
  const [softSkillsList, setSoftSkillsList] = useState([{ skill: '' }]);
  const resumeTitleRef = useRef(null);

  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const templates = [
    { id: 'template1', name: 'Classic', preview: '📄', color: '#4a90e2' },
    { id: 'template2', name: 'Modern', preview: '✨', color: '#2ecc71' },
  ];


  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m your Resume Assistant powered by Gemini AI. Ask me anything about writing your resume! I can provide personalized advice and tips to help you create a standout resume.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('loggedIn') === 'true' ||
    sessionStorage.getItem('loggedIn') === 'true'
  );

  const [userInfo, setUserInfo] = useState('');
  const [selectedSection, setSelectedSection] = useState('personal');

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [educationList, setEducationList] = useState([
    { school: '', degree: '', year: '' },
  ]);

  const [experienceList, setExperienceList] = useState([
    { company: '', position: '', duration: '' },
  ]);

  const [skillsList, setSkillsList] = useState([{ skill: '' }]);
  const [projectsList, setProjectsList] = useState([
    { title: '', description: '', link: '' }
  ]);

  const [showPreview, setShowPreview] = useState(false);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const [isLoading, setIsLoading] = useState(false);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const userMessage = { type: 'user', text: userInput };
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    // Process the question and generate response
    let botResponse = "";
    const question = userInput.toLowerCase();

    try {
      // Initialize the API with simple configuration
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Test with a simple prompt first
      const result = await model.generateContent("Can you help with resume writing?");
      botResponse = (await result.response).text();
    } catch (error) {
      console.error('Error with Gemini API:', error);
      
      // Log detailed error information
      console.log('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response
      });
      
      if (error.message?.includes('API key')) {
        botResponse = "API key error. Please verify your API key configuration.";
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        botResponse = "API access denied. Please check if billing is enabled for your project.";
      } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
        botResponse = "API quota exceeded. Please try again later.";
      } else {
        botResponse = "There was an error connecting to the AI service. Please try again.";
      }
    } finally {
      setIsLoading(false);
      setChatMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    }
};
  const addEducationEntry = () => {
    setEducationList([...educationList, { school: '', degree: '', year: '' }]);
  };

  //     setChatMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
  //   }, 1000);
  // };  const addEducationEntry = () => {
  //   setEducationList([...educationList, { school: '', degree: '', year: '' }]);
  // };

  const handleEducationChange = (index, field, value) => {
    const updatedList = [...educationList];
    updatedList[index][field] = value;
    setEducationList(updatedList);
  };

  const removeEducationEntry = (indexToRemove) => {
    if (educationList.length === 1) return;
    const updatedList = educationList.filter((_, i) => i !== indexToRemove);
    setEducationList(updatedList);
  };

  const addExperienceEntry = () => {
    setExperienceList([
      ...experienceList,
      { company: '', position: '', duration: '' },
    ]);
  };

  const handleExperienceChange = (index, field, value) => {
    const updatedList = [...experienceList];
    updatedList[index][field] = value;
    setExperienceList(updatedList);
  };

  const removeExperienceEntry = (indexToRemove) => {
    if (experienceList.length === 1) return;
    const updatedList = experienceList.filter((_, i) => i !== indexToRemove);
    setExperienceList(updatedList);
  };

  const addSkillEntry = () => {
    setSkillsList([...skillsList, { skill: '' }]);
  };

  const handleSkillChange = (index, value) => {
    const updated = [...skillsList];
    updated[index].skill = value;
    setSkillsList(updated);
  };

  const removeSkillEntry = (indexToRemove) => {
    if (skillsList.length === 1) return;
    const updated = skillsList.filter((_, i) => i !== indexToRemove);
    setSkillsList(updated);
  };

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const checkLogin = () =>
      localStorage.getItem('loggedIn') === 'true' ||
      sessionStorage.getItem('loggedIn') === 'true';

    setIsLoggedIn(checkLogin());

    const savedUser =
      localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    setUserInfo(savedUser || '');
  }, [location]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    sessionStorage.removeItem('loggedIn');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setUserInfo('');
    navigate('/resume-builder');
  };

  const goToNextSection = () => {
    const currentIndex = sectionOrder.indexOf(selectedSection);
    if (currentIndex < sectionOrder.length - 1) {
      const nextSection = sectionOrder[currentIndex + 1];
      if (nextSection === 'preview') {
        setShowPreview(true);
      } else {
        setSelectedSection(nextSection);
        setShowPreview(false);
      }
    }
  };

  const goToPreviousSection = () => {
  if (showPreview) {
    setShowPreview(false);
    setSelectedSection('template');
    return;
  }

  const currentIndex = sectionOrder.indexOf(selectedSection);
  if (currentIndex > 0) {
    const previousSection = sectionOrder[currentIndex - 1];
    setSelectedSection(previousSection);
    setShowPreview(false);
  }
};

  return (

    <div>
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
              style={{ width: '280px' }}
            />
            <button className="btn-grad" onClick={() => navigate('/')}>
              Home
            </button>
            {isLoggedIn ? (
              <button className="btn-grad" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <button
                className="btn-grad"
                onClick={() =>
                  navigate('/login', { state: { from: 'resume-builder' } })
                }
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="resume-builder-container">
          {/* Sidebar */}
          <div className="resume-sidebar">
            <div className="sidebar-brand">
              Build <span className="highlight">Now </span>
            </div>
            <ul className="section-list">
              {[
                { id: 'personal', icon: '👤', label: 'Personal Info' },
                { id: 'about', icon: '📝', label: 'About Me' },
                { id: 'education', icon: '🎓', label: 'Education' },
                { id: 'experience', icon: '💼', label: 'Experience' },
                { id: 'skills', icon: '🛠️', label: 'Skills' },
                { id: 'softskills', icon: '🤝', label: 'Soft Skills' },
                { id: 'projects', icon: '📂', label: 'Projects' },
                { id: 'template', icon: '🎨', label: 'Choose Template' },
                { id: 'preview', icon: '📄', label: 'Preview' }
              ].map(({ id, icon, label }) => (
                <li
                  key={id}
                  className={selectedSection === id || (id === 'preview' && showPreview) ? 'active' : ''}
                  onClick={() => {
                    setSelectedSection(id);
                    setShowPreview(id === 'preview');
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{icon}</span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="sidebar-greeting" style={{ marginTop: '40px', textAlign: 'center' }}>
              <p>👋 Welcome</p>
              <p className="user-name" style={{ fontWeight: 'bold', color: darkMode ? '#f5f5f5' : '#222' }}>
                {isLoggedIn ? userInfo : 'Login to save your progress'}
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="resume-form">
            {!showPreview ? (
              <form>
                {selectedSection === 'personal' && (
                  <>
                    <h3>Personal Information</h3>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                        }
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, email: e.target.value })
                        }
                        placeholder="abc@gmail.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, phone: e.target.value })
                        }
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="form-group">
                      <label>Upload Profile Picture</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfilePhoto(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={personalInfo.address}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, address: e.target.value })
                        }
                        placeholder="abc-abc, abc-abc, Country"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="tel"
                        value={personalInfo.pincode}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, pincode: e.target.value })
                        }
                        placeholder="123456"
                      />
                    </div>
                    {selectedSection !== 'preview' && (
                      <button
                        type="button"
                        onClick={goToNextSection}
                        className="btn-grad"
                        style={{ marginTop: '20px', }}
                      >
                        Next →
                      </button>
                    )}
                  </>
                )}

                {selectedSection === 'about' && (
                  <>
                    <h3>About Me</h3>
                    <div className="form-group">
                      <label>Professional Summary</label>
                      <textarea
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="Write a brief professional summary about yourself (3-4 lines)"
                        style={{
                          width: '96%',
                          minHeight: '120px',
                          padding: '10px',
                          resize: 'vertical',
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: '1.5',
                          backgroundColor: darkMode ? '#333' : '#f5f5f5',
                          color: darkMode ? '#f5f5f5' : '#222',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    {selectedSection !== 'preview' && (
                      <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {selectedSection === 'education' && (
                  <>
                    <h3>Education</h3>
                    {educationList.map((entry, index) => (
                      <div key={index}>
                        <div className="form-group">
                          <label>School / College</label>
                          <input
                            type="text"
                            placeholder="e.g., Delhi University"
                            value={entry.school}
                            onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Degree</label>
                          <input
                            type="text"
                            placeholder="e.g., B.Tech"
                            value={entry.degree}
                            onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Year</label>
                          <input
                            type="text"
                            placeholder="e.g., 2024"
                            value={entry.year}
                            onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                          />
                        </div>

                        {educationList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducationEntry(index)}
                            className="btn-grad"
                            style={{ backgroundColor: '#ff4d4d' }}
                          >
                            Remove
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      {selectedSection !== 'personal' && (
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                      )}
                      <button type="button" className="btn-grad" onClick={addEducationEntry}>
                        + Add More
                      </button>
                      {selectedSection !== 'preview' && (
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                  </>
                )}

                {selectedSection === 'experience' && (
                  <>
                    <h3>Experience</h3>
                    {experienceList.map((entry, index) => (
                      <div key={index}>
                        <div className="form-group">
                          <label>Company</label>
                          <input
                            type="text"
                            value={entry.company}
                            placeholder="e.g., Google"
                            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Position</label>
                          <input
                            type="text"
                            value={entry.position}
                            placeholder="e.g., Software Engineer"
                            onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            value={entry.duration}
                            placeholder="e.g., Jan 2020 - Dec 2021"
                            onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                          />
                        </div>
                        {experienceList.length > 1 && (
                          <button
                            type="button"
                            className="btn-grad"
                            onClick={() => removeExperienceEntry(index)}
                            style={{ backgroundColor: '#ff4d4d' }}
                          >
                            Remove
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      {selectedSection !== 'personal' && (
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                      )}
                      <button type="button" className="btn-grad" onClick={addExperienceEntry}>
                        + Add More
                      </button>
                      {selectedSection !== 'preview' && (
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                  </>
                )}

                {selectedSection === 'skills' && (
                  <>
                    <h3>Skills</h3>
                    {skillsList.map((entry, index) => (
                      <div key={index}>
                        <div className="form-group">
                          <label>Skill</label>
                          <input
                            type="text"
                            value={entry.skill}
                            placeholder="e.g., JavaScript"
                            onChange={(e) => handleSkillChange(index, e.target.value)}
                          />
                        </div>
                        {skillsList.length > 1 && (
                          <button
                            type="button"
                            className="btn-grad"
                            onClick={() => removeSkillEntry(index)}
                            style={{ backgroundColor: '#ff4d4d' }}
                          >
                            Remove
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      {selectedSection !== 'personal' && (
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                      )}
                      <button type="button" className="btn-grad" onClick={addSkillEntry}>
                        + Add More
                      </button>
                      {selectedSection !== 'preview' && (
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                  </>
                )}

                {selectedSection === 'softskills' && (
                  <>
                    <h3>Soft Skills</h3>
                    {softSkillsList.map((entry, index) => (
                      <div key={index}>
                        <div className="form-group">
                          <label>Soft Skill</label>
                          <input
                            type="text"
                            value={entry.skill}
                            placeholder="e.g., Teamwork"
                            onChange={(e) => {
                              const updated = [...softSkillsList];
                              updated[index].skill = e.target.value;
                              setSoftSkillsList(updated);
                            }}
                          />
                        </div>
                        {softSkillsList.length > 1 && (
                          <button
                            type="button"
                            className="btn-grad"
                            onClick={() =>
                              setSoftSkillsList(softSkillsList.filter((_, i) => i !== index))
                            }
                            style={{ backgroundColor: '#ff4d4d' }}
                          >
                            Remove
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      {selectedSection !== 'personal' && (
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-grad"
                        onClick={() => setSoftSkillsList([...softSkillsList, { skill: '' }])}
                      >
                        + Add More
                      </button>
                      {selectedSection !== 'preview' && (
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                  </>
                )}

                {selectedSection === 'template' && (
                  <>
                    <h3>Choose Your Template</h3>
                    <div className="template-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px',
                      padding: '20px'
                    }}>
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTemplate(template.id)}
                          style={{
                            border: selectedTemplate === template.id ? `2px solid ${template.color}` : '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '20px',
                            cursor: 'pointer',
                            backgroundColor: darkMode ? '#2a2a2a' : '#fff',
                            textAlign: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ fontSize: '48px', marginBottom: '10px' }}>{template.preview}</div>
                          <h4 style={{ margin: '0', color: template.color }}>{template.name}</h4>
                          <p style={{ fontSize: '0.9em', color: darkMode ? '#ccc' : '#666' }}>
                            {template.id === 'template1' && 'Professional and clean layout'}
                            {template.id === 'template2' && 'Contemporary and stylish design'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      <button
                        type="button"
                        onClick={goToPreviousSection}
                        className="btn-grad"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={goToNextSection}
                        className="btn-grad"
                      >
                        Next →
                      </button>
                    </div>
                  </>
                )}

                {selectedSection === 'projects' && (
                  <>
                    <h3>Projects</h3>
                    {projectsList.map((proj, index) => (
                      <div key={index}>
                        <div className="form-group">
                          <label>Project Title</label>
                          <input
                            type="text"
                            value={proj.title}
                            placeholder="e.g., Portfolio Website"
                            onChange={(e) =>
                              setProjectsList(projectsList.map((p, i) =>
                                i === index ? { ...p, title: e.target.value } : p
                              ))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            rows={1}
                            placeholder="Describe the project..."
                            value={proj.description}
                            onChange={(e) => {
                              const textarea = e.target;
                              textarea.style.height = 'auto'; // Reset height first
                              textarea.style.height = textarea.scrollHeight + 'px'; // Then set it dynamically

                              setProjectsList(projectsList.map((p, i) =>
                                i === index ? { ...p, description: textarea.value } : p
                              ));
                            }}
                            style={{
                              color: darkMode ? '#f5f5f5' : '#222',
                              backgroundColor: darkMode ? '#333' : '#f5f5f5',
                              width: '96%',
                              resize: 'none',
                              overflow: 'hidden',
                              minHeight: '60px',
                              lineHeight: '1.4',
                              padding: '8px'
                            }}
                          />

                        </div>
                        <div className="form-group">
                          <label>Project Link</label>
                          <input
                            type="url"
                            placeholder="https://github.com/your-project"
                            value={proj.link}
                            onChange={(e) =>
                              setProjectsList(projectsList.map((p, i) =>
                                i === index ? { ...p, link: e.target.value } : p
                              ))
                            }
                          />
                        </div>

                        {projectsList.length > 1 && (
                          <button
                            type="button"
                            className="btn-grad"
                            onClick={() =>
                              setProjectsList(projectsList.filter((_, i) => i !== index))
                            }
                            style={{ backgroundColor: '#ff4d4d' }}
                          >
                            Remove
                          </button>
                        )}
                        <hr />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '70px', marginTop: '20px' }}>
                      {selectedSection !== 'personal' && (
                        <button
                          type="button"
                          onClick={goToPreviousSection}
                          className="btn-grad"
                        >
                          ← Back
                        </button>
                      )}
                      <button type="button" className="btn-grad" onClick={() =>
                        setProjectsList([...projectsList, { title: '', description: '' }])
                      }>
                        + Add More
                      </button>
                      {selectedSection !== 'preview' && (
                        <button
                          type="button"
                          onClick={goToNextSection}
                          className="btn-grad"
                        >
                          Next →
                        </button>
                      )}
                    </div>

                  </>
                )}

              </form>
            ) : (

              <div className="preview-section">
                <div
                  ref={previewRef}
                  className={`resume-preview template-${selectedTemplate}`}
                  style={{
                    padding: '30px',
                    backgroundColor: '#fff',
                    color: '#333',
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}
                >
                  {selectedTemplate === 'template1' && (
                    // Classic Template
                    <div style={{ fontFamily: 'Georgia, serif' }}>
                      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #4a90e2', paddingBottom: '20px' }}>
                        {profilePhoto && (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '50%',
                              marginBottom: '15px',
                              border: '3px solid #4a90e2'
                            }}
                          />
                        )}
                        {personalInfo.fullName && (
                          <h1 style={{ color: '#4a90e2', margin: '10px 0' }}>{personalInfo.fullName}</h1>
                        )}
                        {(personalInfo.email || personalInfo.phone) && (
                          <p style={{ color: '#666' }}>
                            {[
                              personalInfo.email,
                              personalInfo.phone
                            ].filter(Boolean).join(' | ')}
                          </p>
                        )}
                        {personalInfo.address && (
                          <p style={{ color: '#666' }}>{personalInfo.address}</p>
                        )}
                      </div>

                      {about && (
                        <div style={{ marginBottom: '25px' }}>
                          <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>About Me</h2>
                          <p style={{ 
                            color: '#666', 
                            lineHeight: '1.6', 
                            textAlign: 'justify',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            maxWidth: '100%',
                            margin: '10px 0'
                          }}>{about}</p>
                        </div>
                      )}

                      {educationList.some(edu => edu.school || edu.degree || edu.year) && (
                        <div style={{ marginBottom: '25px' }}>
                          <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>Education</h2>
                          {educationList.filter(edu => edu.school || edu.degree || edu.year).map((edu, i) => (
                            <div key={i} style={{ marginBottom: '15px' }}>
                              {edu.degree && (
                                <h3 style={{ margin: '5px 0', color: '#333' }}>{edu.degree}</h3>
                              )}
                              <p style={{ margin: '3px 0', color: '#666' }}>
                                {[edu.school, edu.year].filter(Boolean).join(' | ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {experienceList.some(exp => exp.company || exp.position || exp.duration) && (
                        <div style={{ marginBottom: '25px' }}>
                          <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>Experience</h2>
                          {experienceList.filter(exp => exp.company || exp.position || exp.duration).map((exp, i) => (
                            <div key={i} style={{ marginBottom: '15px' }}>
                              {exp.position && (
                                <h3 style={{ margin: '5px 0', color: '#333' }}>{exp.position}</h3>
                              )}
                              {(exp.company || exp.duration) && (
                                <p style={{ margin: '3px 0', color: '#666' }}>
                                  {[exp.company, exp.duration].filter(Boolean).join(' | ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {(skillsList.some(s => s.skill) || softSkillsList.some(s => s.skill)) && (
                        <div style={{ display: 'flex', gap: '30px', marginBottom: '25px' }}>
                          {skillsList.some(s => s.skill) && (
                            <div style={{ flex: 1 }}>
                              <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>Skills</h2>
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {skillsList.filter(s => s.skill).map((s, i) => (
                                  <li key={i} style={{ margin: '5px 0', color: '#333' }}>• {s.skill}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {softSkillsList.some(s => s.skill) && (
                            <div style={{ flex: 1 }}>
                              <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>Soft Skills</h2>
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {softSkillsList.filter(s => s.skill).map((s, i) => (
                                  <li key={i} style={{ margin: '5px 0', color: '#333' }}>• {s.skill}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {projectsList.some(proj => proj.title || proj.description || proj.link) && (
                        <div>
                          <h2 style={{ color: '#4a90e2', borderBottom: '1px solid #4a90e2', paddingBottom: '5px' }}>Projects</h2>
                          {projectsList.filter(proj => proj.title || proj.description || proj.link).map((proj, i) => (
                            <div key={i} style={{ marginBottom: '15px' }}>
                              {proj.title && (
                                <h3 style={{ margin: '5px 0', color: '#333' }}>{proj.title}</h3>
                              )}
                              {proj.description && (
                                <p style={{ margin: '3px 0', color: '#666' }}>{proj.description}</p>
                              )}
                              {proj.link && (
                                <a href={proj.link} style={{ color: '#4a90e2', textDecoration: 'none' }}>{proj.link}</a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTemplate === 'template2' && (
                    <div style={{ fontFamily: 'Arial, sans-serif' }}>
                      <div style={{
                        display: 'flex',
                        gap: '30px',
                        backgroundColor: '#2ecc71',
                        padding: '30px',
                        color: 'white',
                        borderRadius: '10px 10px 0 0'
                      }}>
                        {profilePhoto && (
                          <img
                            src={profilePhoto}
                            alt="Profile"
                            style={{
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '10px'
                            }}
                          />
                        )}
                        <div>
                          {personalInfo.fullName && (
                            <h1 style={{ margin: '0', fontSize: '2.5em' }}>{personalInfo.fullName}</h1>
                          )}
                          <div style={{ marginTop: '10px' }}>
                            {personalInfo.email && (
                              <p style={{ margin: '5px 0' }}>📧 {personalInfo.email}</p>
                            )}
                            {personalInfo.phone && (
                              <p style={{ margin: '5px 0' }}>📱 {personalInfo.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '30px', backgroundColor: '#f8f9fa' }}>
                        {about && (
                          <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                              About Me
                            </h2>
                            <div style={{
                              backgroundColor: 'white',
                              padding: '20px',
                              borderRadius: '8px',
                              marginTop: '15px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              <p style={{ 
                                margin: '0', 
                                color: '#666', 
                                lineHeight: '1.6', 
                                textAlign: 'justify',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                maxWidth: '100%'
                              }}>{about}</p>
                            </div>
                          </div>
                        )}

                        {educationList.some(edu => edu.school || edu.degree || edu.year) && (
                          <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                              Education
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '15px' }}>
                              {educationList.map((edu, i) => (
                                <div key={i} style={{
                                  backgroundColor: 'white',
                                  padding: '15px',
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <h3 style={{ color: '#2ecc71', margin: '0' }}>{edu.degree}</h3>
                                  <p style={{ margin: '5px 0', color: '#666' }}>{edu.school}</p>
                                  <p style={{ margin: '5px 0', color: '#888' }}>{edu.year}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {experienceList.some(exp => exp.company || exp.position || exp.duration) && (
                          <div style={{ marginBottom: '30px' }}>
                            <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                              Experience
                            </h2>
                            {experienceList.map((exp, i) => (
                              <div key={i} style={{
                                backgroundColor: 'white',
                                padding: '15px',
                                borderRadius: '8px',
                                marginTop: '15px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                <h3 style={{ color: '#2ecc71', margin: '0' }}>{exp.position}</h3>
                                <p style={{ margin: '5px 0', color: '#666' }}>{exp.company}</p>
                                <p style={{ margin: '5px 0', color: '#888' }}>{exp.duration}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {(skillsList.some(s => s.skill) || softSkillsList.some(s => s.skill)) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                            {skillsList.some(s => s.skill) && (
                              <div>
                                <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                                  Skills
                                </h2>
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '10px',
                                  marginTop: '15px'
                                }}>
                                  {skillsList.map((s, i) => (
                                    <span key={i} style={{
                                      backgroundColor: '#2ecc71',
                                      color: 'white',
                                      padding: '5px 15px',
                                      borderRadius: '20px',
                                      fontSize: '0.9em'
                                    }}>
                                      {s.skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {softSkillsList.some(s => s.skill) && (
                              <div>
                                <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                                  Soft Skills
                                </h2>
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '10px',
                                  marginTop: '15px'
                                }}>
                                  {softSkillsList.map((s, i) => (
                                    <span key={i} style={{
                                      backgroundColor: '#e8f5e9',
                                      color: '#2ecc71',
                                      padding: '5px 15px',
                                      borderRadius: '20px',
                                      fontSize: '0.9em'
                                    }}>
                                      {s.skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {projectsList.some(proj => proj.title || proj.description || proj.link) && (
                          <div>
                            <h2 style={{ color: '#2ecc71', borderBottom: '2px solid #2ecc71', display: 'inline-block' }}>
                              Projects
                            </h2>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                              gap: '20px',
                              marginTop: '15px'
                            }}>
                              {projectsList.map((proj, i) => (
                                <div key={i} style={{
                                  backgroundColor: 'white',
                                  padding: '15px',
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <h3 style={{ color: '#2ecc71', margin: '0' }}>{proj.title}</h3>
                                  <p style={{ margin: '10px 0', color: '#666' }}>{proj.description}</p>
                                  {proj.link && (
                                    <a href={proj.link} style={{ color: '#2ecc71', textDecoration: 'none' }}>{proj.link}</a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

               </div>

                {showPreview && (

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                    <button
                      onClick={goToPreviousSection}
                      className="btn-grad"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        const element = previewRef.current;
                        const originalBg = element.style.backgroundColor;
                        const originalColor = element.style.color;
                        const originalBorder = element.style.border;
                        const titleEl = element.querySelector('h1');
                        const originalTitleDisplay = titleEl?.style.display;

                        element.style.backgroundColor = '#fff';
                        element.style.color = '#000';
                        element.style.border = '1px solid #ccc';

                        html2pdf().set({
                          margin: 0.5,
                          filename: `${personalInfo.fullName || 'resume'}.pdf`,
                          image: { type: 'jpeg', quality: 0.98 },
                          html2canvas: { scale: 2 },
                          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                        }).from(element).save().then(() => {
                          element.style.backgroundColor = originalBg;
                          element.style.color = originalColor;
                          element.style.border = originalBorder;
                          if (titleEl) titleEl.style.display = originalTitleDisplay || 'block';
                        });
                      }}
                      className="btn-grad"
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div> 
            )} 
          </div> 
        </div> 
      </main>
    </div>
  );

}
export default ResumeBuilder;
