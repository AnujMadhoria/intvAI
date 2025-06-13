import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiMenu, FiX, FiFileText, FiCalendar, FiClock, FiUser, FiMail, FiLogOut, FiUpload, FiVideo, FiTrash2, FiEye } from 'react-icons/fi';

function CandidateDashboard() {
  const [data, setData] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [notifications, setNotifications] = useState([]);

  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const fetchInterviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/candidate/my-interviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [dashboardRes, userRes] = await Promise.all([
        axios.get('http://localhost:5000/api/candidate/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setData({
        ...dashboardRes.data,
        user: userRes.data
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.user) {
      setFormData({
        name: data.user.name || '',
        email: data.user.email || ''
      });
    }
  }, [data]);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put(
        'http://localhost:5000/api/candidate/update-info',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData({ ...data, user: res.data.user });
      setEditMode(false);
    } catch (err) {
      console.error('Error updating info:', err);
      alert(err.response?.data?.error || 'Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    fetchInterviews();

    const socket = io('http://localhost:5000', { auth: { token } });
    if (userId) socket.emit('join', userId);
    // Listen for new interview notifications
    socket.on('newInterview', (notif) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(), // unique id for dismiss
          ...notif,
        },
      ]);
      fetchInterviews(); // Optionally refresh interviews
    });
    socket.on('newInterview', fetchInterviews);
    const interval = setInterval(fetchInterviews, 60000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [userId]);

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
      setLoading(true);
      await axios.post('http://localhost:5000/api/candidate/upload-resume', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumeFile(null);
      fetchData();
    } catch (err) {
      console.error('Error uploading resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      setLoading(true);
      await axios.delete('http://localhost:5000/api/candidate/delete-resume', {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingInterviews = interviews.filter(
    (interview) => new Date(interview.scheduledAt) > new Date()
  );
  
  const pastInterviews = interviews.filter(
    (interview) => new Date(interview.scheduledAt) <= new Date()
  );
  
  const todayInterviews = interviews.filter(interview => {
    const interviewDate = new Date(interview.scheduledAt);
    const today = new Date();
    return (
      interviewDate.getDate() === today.getDate() &&
      interviewDate.getMonth() === today.getMonth() &&
      interviewDate.getFullYear() === today.getFullYear() &&
      interviewDate > new Date() // Only upcoming interviews today
    );
  });

  

  const renderLoader = () => (
    <div className="flex justify-center items-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderLoader();

    switch (activeTab) {
      case 'resume':
        return (
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiFileText className="mr-2" /> Manage Resume
            </h3>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <form onSubmit={handleResumeUpload} className="mb-6">
                <div className="mb-4">
                  <label className=" text-gray-700 mb-2 flex items-center">
                    <FiUpload className="mr-2" /> Upload Resume (PDF only)
                  </label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="border p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                    >
                      <FiUpload className="mr-2" /> Upload
                    </button>
                  </div>
                </div>
              </form>

              {data?.resumeUrl && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <FiFileText className="mr-2" /> Current Resume
                  </h4>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <iframe
                        src={`http://localhost:5000${data.resumeUrl}#toolbar=0`}
                        className="w-full h-96 border rounded shadow-sm"
                      ></iframe>
                    </div>
                    <div className="flex flex-col gap-3">
                      <a
                        href={`http://localhost:5000${data.resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                      >
                        <FiEye className="mr-2" /> View Full PDF
                      </a>
                      <button
                        onClick={handleDeleteResume}
                        className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
                      >
                        <FiTrash2 className="mr-2" /> Delete Resume
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'upcoming':
        return (
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiCalendar className="mr-2" /> Upcoming Interviews
            </h3>
            {upcomingInterviews.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No upcoming interviews scheduled</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingInterviews.map((interview) => (
                  <div key={interview._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold flex items-center">
                          <FiUser className="mr-2 text-blue-600" /> Interview with {interview.interviewerId?.name || 'Interviewer'}
                        </h4>
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                          <FiMail className="mr-2" /> {interview.interviewerId?.email || 'No email provided'}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Upcoming
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 flex items-center">
                        <FiClock className="mr-2" />
                        <span className="font-medium">Scheduled:</span> {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                      <p className="text-gray-700 mt-2">
                        <span className="font-medium">Status:</span> {interview.status}
                      </p>
                    </div>
                    
                    {interview.joinLink && (
                      <a
                        href={interview.joinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition flex items-center justify-center"
                      >
                        <FiVideo className="mr-2" /> Join Interview
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'today':
        return (
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiClock className="mr-2" /> Today's Interviews
            </h3>
            {todayInterviews.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No interviews scheduled for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {todayInterviews.map((interview) => (
                  <div key={interview._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold flex items-center">
                          <FiUser className="mr-2 text-yellow-600" /> Interview with {interview.interviewerId?.name || 'Interviewer'}
                        </h4>
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                          <FiMail className="mr-2" /> {interview.interviewerId?.email || 'No email provided'}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        Today
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 flex items-center">
                        <FiClock className="mr-2" />
                        <span className="font-medium">Time:</span> {new Date(interview.scheduledAt).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-700 mt-2">
                        <span className="font-medium">Status:</span> {interview.status}
                      </p>
                    </div>
                    
                    {interview.joinLink && (
                      <a
                        href={interview.joinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition flex items-center justify-center"
                      >
                        <FiVideo className="mr-2" /> Join Interview
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiClock className="mr-2" /> Interview History
            </h3>
            {pastInterviews.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No past interviews found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastInterviews.map((interview) => (
                  <div key={interview._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold flex items-center">
                          <FiUser className="mr-2 text-gray-600" /> Interview with {interview.interviewerId?.name || 'Interviewer'}
                        </h4>
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                          <FiMail className="mr-2" /> {interview.interviewerId?.email || 'No email provided'}
                        </p>
                      </div>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        Completed
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 flex items-center">
                        <FiClock className="mr-2" />
                        <span className="font-medium">Date:</span> {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiUser className="mr-2" /> Profile Information
            </h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {editMode ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className=" text-gray-700 mb-2 flex items-center">
                      <FiUser className="mr-2" /> Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className=" text-gray-700 mb-2 flex items-center">
                      <FiMail className="mr-2" /> Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition flex items-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-500 text-sm">Name</label>
                    <p className="text-lg">{data?.user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm">Email</label>
                    <p className="text-lg">{data?.user?.email}</p>
                  </div>
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center mt-4"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">👨‍🎓 Candidate</h2>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white focus:outline-none"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-800 text-white p-4">
          <button 
            onClick={() => { setActiveTab('resume'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'resume' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiFileText className="mr-2" /> Resume
          </button>
          
          <button 
            onClick={() => { setActiveTab('today'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'today' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiClock className="mr-2" /> Today's
          </button>
          
          <button 
            onClick={() => { setActiveTab('upcoming'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'upcoming' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiCalendar className="mr-2" /> Upcoming
          </button>
          
          <button 
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'history' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiClock className="mr-2" /> History
          </button>
          
          <button 
            onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'profile' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiUser className="mr-2" /> Profile
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 flex items-center mt-4"
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 bg-blue-800 text-white p-4 flex-col">
        <h2 className="text-2xl font-bold mb-8 mt-4">👨‍🎓 Candidate</h2>
        
        <button 
          onClick={() => setActiveTab('resume')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'resume' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiFileText className="mr-2" /> Resume
        </button>
        
        <button 
          onClick={() => setActiveTab('today')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'today' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiClock className="mr-2" /> Today's
        </button>
        
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'upcoming' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiCalendar className="mr-2" /> Upcoming
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'history' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiClock className="mr-2" /> History
        </button>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'profile' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiUser className="mr-2" /> Profile
        </button>
        
        <div className="mt-auto mb-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 flex items-center"
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Notification Banner */}
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded relative mb-4 flex items-center justify-between shadow"
          >
            <div>
              <strong>New Interview:</strong> {notif.message}
              {notif.link && (
                <a
                  href={notif.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline text-blue-600"
                >
                  Join Interview
                </a>
              )}
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
              className="ml-4 text-blue-800 hover:text-blue-900 font-bold text-lg"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}

        {renderContent()}
      </div>
    </div>
  );
}

export default CandidateDashboard;