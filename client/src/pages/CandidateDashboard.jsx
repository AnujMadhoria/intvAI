import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function CandidateDashboard() {
  const [data, setData] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const token = localStorage.getItem('token'); // ✅ declare first!

  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id; // or decoded._id depending on your token payload

  const fetchInterviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/candidate/my-interviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchInterviews();

    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
    });

    if (userId) {
      socket.emit('join', userId); // join room for this user
    }

    // Listen for new interviews in real-time
    socket.on('newInterview', (newInterview) => {
      setInterviews((prev) => [newInterview, ...prev]); // Add it to the top of the list
    });

    const interval = setInterval(fetchInterviews, 60000); // fallback polling every 60s

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [userId]);


  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/candidate/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    navigate('/');
    window.location.reload();
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      await axios.post('http://localhost:5000/api/candidate/upload-resume', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResumeFile(null);
      fetchData();
    } catch (err) {
      console.error('Error uploading resume:', err);
    }
  };

  const handleDeleteResume = async () => {
    try {
      await axios.delete('http://localhost:5000/api/candidate/delete-resume', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">🎓 Candidate Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleResumeUpload} className="flex items-center space-x-4 mb-6">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setResumeFile(e.target.files[0])}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          Upload Resume
        </button>
      </form>

      {data?.resumeUrl && (
        <div className="mb-6 border p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-green-700 mb-2">✅ Resume Uploaded:</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-4">
            <iframe
              src={`http://localhost:5000${data.resumeUrl}#toolbar=0`}
              title="Resume Preview"
              className="w-full md:w-64 h-64 border rounded shadow"
            ></iframe>
            <div className="mt-4 md:mt-0">
              <a
                href={`http://localhost:5000${data.resumeUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline block mb-2"
              >
                View Full PDF
              </a>
              <button
                onClick={handleDeleteResume}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow"
              >
                Delete Resume
              </button>
            </div>
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">🎤 My Interviews</h3>

      {interviews.length === 0 ? (
        <p className="text-gray-500 mb-6">No interviews scheduled.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {interviews.map((interview) => {
            const isUpcoming = new Date(interview.date) > new Date();
            return (
              <li key={interview._id} className="border p-3 rounded shadow hover:bg-gray-50 transition flex justify-between items-center">
                <div>
                  <p><b>Date:</b> {new Date(interview.scheduledAt).toLocaleString()}</p>
                  <p><b>Status:</b> {interview.status}</p>
                  <p><b>Interviewer:</b> {interview.interviewerId?.fullName || interview.interviewerId?.name ||'Unknown'}</p>
                  <p><b>Candidate:</b> {interview.candidateId?.name || 'You'}</p>
                  <p><b>Join Link:</b> {interview.joinLink ? <a href={interview.joinLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">Join Here</a> : 'Not available'}</p>
                </div>
                {isUpcoming && interview.status === 'scheduled' && (
                  <a
                    href={interview.joinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                  >
                    Join Interview
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="text-xl font-semibold text-gray-700 mb-2">🧠 AI Suggestions</h3>
      {data?.suggestions?.length ? (
        <ul className="list-disc ml-6 mb-6 text-gray-700">
          {data.suggestions.map((sug, i) => (
            <li key={i}>{sug}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 mb-6">No suggestions yet.</p>
      )}

      <h3 className="text-xl font-semibold text-gray-700 mb-2">📜 Past Interview Reports</h3>
      {data?.reports?.length ? (
        <ul className="space-y-4">
          {data.reports.map((report, i) => (
            <li key={i} className="border p-3 rounded shadow hover:bg-gray-50 transition">
              <p><b>Date:</b> {new Date(report.date).toLocaleString()}</p>
              <p><b>Status:</b> {report.status}</p>
              <a
                href={`/report/${report._id}`}
                className="text-blue-600 underline"
              >
                View Report
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No interview reports available.</p>
      )}
    </div>
  );
}

export default CandidateDashboard;
