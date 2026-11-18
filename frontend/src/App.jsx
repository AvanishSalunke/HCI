import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css'; 

import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import Welcome from './pages/Welcome';
import CommitteeLogin from './pages/CommitteeLogin';
import Announcements from './pages/Announcements';
import Feedback from './pages/Feedback';
import Faculty from './pages/Faculty';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css'; 

function App() {
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-back',
      offset: 40,
    });
  }, []);

  // pages are re-mounted on navigation, so let AOS find the new elements
  useEffect(() => {
    const t = setTimeout(() => AOS.refreshHard(), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Navbar />
      <main key={location.pathname} className="page-transition">
        <Routes location={location}>
          <Route path="/" element={<Welcome />} />
          <Route path="/login/:committeeId" element={<CommitteeLogin />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;