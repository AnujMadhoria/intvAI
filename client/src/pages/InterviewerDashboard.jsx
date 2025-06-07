import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [datetime, setDatetime] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchInterviews = async () => {
    const res = await axios.get('http://localhost:5000/api/interviewer/my-interviews', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setInterviews(res.data);
  };

  const createInterview = async (e) => {
    e.preventDefault();
    if (!candidateEmail || !datetime) return;

    await axios.post(
      'http://localhost:5000/api/interviewer/create',
      { candidateEmail, datetime },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setCandidateEmail('');
    setDatetime('');
    fetchInterviews();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    navigate('/');
    window.location.reload();
  };
  

  useEffect(() => {
    fetchInterviews();
  }, []);
  
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🧑‍💼 Interviewer Dashboard</h2>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>

      <form onSubmit={createInterview} className="mb-6">
        <h3 className="text-xl font-semibold mb-2">📅 Schedule Interview</h3>
        <input
          type="email"
          placeholder="Candidate Email"
          value={candidateEmail}
          onChange={(e) => setCandidateEmail(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <button type="submit" className="btn">Create</button>
      </form>

      <h3 className="text-xl font-semibold mb-2">📋 My Interviews</h3>
      <ul className="space-y-3">
        {interviews.map((int) => (
          <li key={int._id} className="border p-3 rounded shadow">
            <p><b>Candidate:</b> {int.candidateId?.name}</p>
            <p><b>email:</b> ({int.candidateId.email})</p>
            <p><b>Time:</b> {new Date(int.scheduledAt).toLocaleString()}</p>
            <p><b>Status:</b> {int.status}</p>
{console.log('Resume URL:', int.candidateId.resumeUrl)}

<a
  href={`http://localhost:5000${int.candidateId.resumeUrl}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 underline mr-2"
>
  View Profile
</a>
            {/* 🚀 Add Take Interview Button */}
            {int.interviewLink && (
              <a
                href={int.joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-black px-3 py-1 rounded ml-2"
              >
                Take Interview
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InterviewerDashboard;

