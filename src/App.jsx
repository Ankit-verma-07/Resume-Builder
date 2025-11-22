// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Reset from './Reset';
import Home from './Home';
import ModalWrapper from './ModalWrapper';
import ResumeBuilder from './ResumeBuilder';
import Feedback from "./Feedback";
import AdminPage from './AdminPage';
import MyResume from './MyResume';
import './App.css';

function AppRoutes() {
  const location = useLocation();
  const fromPage = location.state?.from === 'resume-builder' ? <ResumeBuilder /> : <Home />;

  return (
    <>
      <Routes>
  <Route path="/my-resume" element={<MyResume />} />
  
  <Route path="/" element={<Home />} />
  <Route path="/home" element={<Home />} />
  <Route path="/resume-builder" element={<ResumeBuilder />} />
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/feedback" element={<Feedback />} />

 


  {/* Modal routes */}
  <Route
    path="/login"
    element={
      <>
        {fromPage}
        <ModalWrapper>
          <Login />
        </ModalWrapper>
      </>
    }
  />
  <Route
    path="/register"
    element={
      <>
        {fromPage}
        <ModalWrapper>
          <Register />
        </ModalWrapper>
      </>
    }
  />
  <Route
    path="/reset"
    element={
      <>
        {fromPage}
        <ModalWrapper>
          <Reset />
        </ModalWrapper>
      </>
    }
  />
</Routes>


      {/* ✅ Floating Chat Widget will be visible on all pages */}

    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
