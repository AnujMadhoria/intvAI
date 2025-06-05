import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import CandidateDashboard from './pages/CandidateDashboard';
import InterviewerDashboard from './pages/InterviewerDashboard';
import './index.css';
import JoinInterviewPage from './pages/JoinInterviewPage ';

function App() {
  const token = localStorage.getItem('token');
  const type = localStorage.getItem('type'); // 'candidate' or 'interviewer'
 
  
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={token ? (type === 'candidate' ? <Navigate to="/candidate" /> : <Navigate to="/interviewer" />) : <Auth />} />
        <Route path="/candidate" element={<CandidateDashboard />} />
        <Route path="/interviewer" element={<InterviewerDashboard />} />
        <Route path="/join-interview/:roomId" element={<JoinInterviewPage />} />

      </Routes>
    </Router>
  );
}

export default App;
