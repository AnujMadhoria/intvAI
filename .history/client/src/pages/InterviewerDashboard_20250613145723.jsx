import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMenu, FiX, FiCalendar, FiClock, FiUser, FiMail, FiFileText, FiVideo, FiLogOut, FiCheckSquare } from 'react-icons/fi';

function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [datetime, setDatetime] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isConsidering, setIsConsidering] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [creatingInterview, setCreatingInterview] = useState(false);
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');

  const fetchInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const res = await axios.get('http://localhost:5000/api/interviewer/my-interviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterviews(res.data);
      // Initialize consideration state
      const considerationState = {};
      res.data.forEach(int => {
        considerationState[int._id] = int.considered || false;
      });
      setIsConsidering(considerationState);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const createInterview = async (e) => {
    e.preventDefault();
    if (!candidateEmail || !datetime) return;

    try {
      setCreatingInterview(true);
      await axios.post(
        'http://localhost:5000/api/interviewer/create',
        { candidateEmail, datetime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidateEmail('');
      setDatetime('');
      await fetchInterviews();
    } catch (error) {
      console.error('Error creating interview:', error);
    } finally {
      setCreatingInterview(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    navigate('/');
    window.location.reload();
  };

  const toggleConsiderCandidate = async (interviewId) => {
    const newState = !isConsidering[interviewId];
    setIsConsidering(prev => ({ ...prev, [interviewId]: newState }));

    try {
      await axios.patch(
        `http://localhost:5000/api/interviewer/consider/${interviewId}`,
        { considered: newState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating consideration status:', error);
      // Revert state if error occurs
      setIsConsidering(prev => ({ ...prev, [interviewId]: !newState }));
    }
  };

  // Fetch interviewer profile info
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await axios.get('http://localhost:5000/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setProfileData({ name: res.data.name || '', email: res.data.email || '' });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Update interviewer info
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const res = await axios.put(
        'http://localhost:5000/api/interviewer/update-info',
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setEditMode(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update information');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchInterviews();
  }, []);

  // Filter interviews based on tab
  const getFilteredInterviews = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return interviews.filter(int => {
      const interviewDate = new Date(int.scheduledAt);

      if (activeTab === 'today') {
        return interviewDate.toDateString() === today.toDateString();
      } else if (activeTab === 'history') {
        return interviewDate < today;
      }
      return interviewDate >= today;
    }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  };

  // Loading spinner component
  const LoadingSpinner = ({ size = 'md' }) => (
    <div className={`flex justify-center items-center ${size === 'sm' ? 'h-5 w-5' : 'h-8 w-8'}`}>
      <div className={`animate-spin rounded-full ${size === 'sm' ? 'h-4 w-4 border-2' : 'h-6 w-6 border-4'} border-blue-500 border-t-transparent`}></div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">🧑‍💼 Interviewer</h2>
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
            onClick={() => { setActiveTab('upcoming'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'upcoming' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiCalendar className="mr-2" /> Upcoming
          </button>

          <button
            onClick={() => { setActiveTab('today'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'today' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiClock className="mr-2" /> Today's
          </button>

          <button
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            className={`w-full text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'history' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            <FiFileText className="mr-2" /> History
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
        <h2 className="text-2xl font-bold mb-8 mt-4">🧑‍💼 Interviewer</h2>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'upcoming' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiCalendar className="mr-2" /> Upcoming
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'today' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiClock className="mr-2" /> Today's
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`text-left p-3 rounded-lg mb-2 flex items-center ${activeTab === 'history' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
        >
          <FiFileText className="mr-2" /> History
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
        {activeTab === 'profile' ? (
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <FiUser className="mr-2" /> Profile Information
            </h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {profileLoading && !editMode ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : editMode ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className=" text-gray-700 mb-2 flex items-center">
                      <FiUser className="mr-2" /> Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
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
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-32"
                      disabled={profileLoading}
                    >
                      {profileLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
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
                    <p className="text-lg">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm">Email</label>
                    <p className="text-lg">{user?.email}</p>
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
        ) : activeTab === 'upcoming' ? (
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6">Schedule New Interview</h3>
            <form onSubmit={createInterview} className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className=" text-gray-700 mb-2 flex items-center">
                    <FiMail className="mr-2" /> Candidate Email
                  </label>
                  <input
                    type="email"
                    placeholder="Candidate Email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className=" text-gray-700 mb-2 flex items-center">
                    <FiCalendar className="mr-2" /> Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-32"
                disabled={creatingInterview}
              >
                {creatingInterview ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FiCalendar className="mr-2" /> Schedule Interview
                  </>
                )}
              </button>
            </form>

            {/* Upcoming Interviews List */}
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FiCalendar className="mr-2" /> Upcoming Interviews
            </h3>
            {loadingInterviews ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : getFilteredInterviews().length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No upcoming interviews found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {getFilteredInterviews().map((int) => {
                  const interviewDate = new Date(int.scheduledAt);
                  const isPastInterview = interviewDate < new Date();
                  const isToday = interviewDate.toDateString() === new Date().toDateString();

                  return (
                    <div key={int._id} className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg md:text-xl font-semibold flex items-center">
                            <FiUser className="mr-2 text-blue-600" /> {int.candidateId?.name || 'Candidate'}
                          </h4>
                          <p className="text-gray-600 text-sm md:text-base flex items-center mt-1">
                            <FiMail className="mr-2" /> {int.candidateId?.email}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs md:text-sm ${
                          isPastInterview
                            ? int.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            : isToday
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isPastInterview
                            ? (int.status === 'completed' ? 'Completed' : 'Passed away')
                            : isToday
                              ? 'Today'
                              : 'Upcoming'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700 text-sm md:text-base flex items-center">
                          <FiClock className="mr-2" />
                          <span className="font-medium">Scheduled:</span> {interviewDate.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {int.candidateId?.resumeUrl && (
                          <a
                            href={`http://localhost:5000${int.candidateId.resumeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-800 px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-gray-200 transition flex items-center text-sm md:text-base"
                          >
                            <FiFileText className="mr-1 md:mr-2" /> View Profile
                          </a>
                        )}

                        {!isPastInterview && int.interviewLink && (
                          <a
                            href={int.interviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-100 text-green-800 px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-green-200 transition flex items-center text-sm md:text-base"
                          >
                            <FiVideo className="mr-1 md:mr-2" /> Join Interview
                          </a>
                        )}
                        {int.status && (
                          <div className="mt-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`consider-${int._id}`}
                              checked={isConsidering[int._id]}
                              onChange={() => toggleConsiderCandidate(int._id)}
                              className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`consider-${int._id}`} className="ml-2 text-gray-500 text-sm md:text-base flex items-center">
                              <FiCheckSquare className="mr-1" /> Consider this candidate
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              {activeTab === 'today' ? (
                <>
                  <FiClock className="mr-2" /> Today's Interviews
                </>
              ) : activeTab === 'history' ? (
                <>
                  <FiFileText className="mr-2" /> Interview History
                </>
              ) : (
                <>
                  <FiCalendar className="mr-2" /> Upcoming Interviews
                </>
              )}
            </h3>

            {loadingInterviews ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : getFilteredInterviews().length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No interviews found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {getFilteredInterviews().map((int) => {
                  const interviewDate = new Date(int.scheduledAt);
                  const isPastInterview = interviewDate < new Date();
                  const isToday = interviewDate.toDateString() === new Date().toDateString();

                  return (
                    <div key={int._id} className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg md:text-xl font-semibold flex items-center">
                            <FiUser className="mr-2 text-blue-600" /> {int.candidateId?.name || 'Candidate'}
                          </h4>
                          <p className="text-gray-600 text-sm md:text-base flex items-center mt-1">
                            <FiMail className="mr-2" /> {int.candidateId?.email}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs md:text-sm ${
                          isPastInterview
                            ? int.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            : isToday
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isPastInterview
                            ? (int.status === 'completed' ? 'Completed' : 'Passed away')
                            : isToday
                              ? 'Today'
                              : 'Upcoming'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700 text-sm md:text-base flex items-center">
                          <FiClock className="mr-2" />
                          <span className="font-medium">Scheduled:</span> {interviewDate.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {int.candidateId?.resumeUrl && (
                          <a
                            href={`http://localhost:5000${int.candidateId.resumeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-800 px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-gray-200 transition flex items-center text-sm md:text-base"
                          >
                            <FiFileText className="mr-1 md:mr-2" /> View Profile
                          </a>
                        )}

                        {!isPastInterview && int.interviewLink && (
                          <a
                            href={int.interviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-100 text-green-800 px-3 py-1 md:px-4 md:py-2 rounded-lg hover:bg-green-200 transition flex items-center text-sm md:text-base"
                          >
                            <FiVideo className="mr-1 md:mr-2" /> Join Interview
                          </a>
                        )}
                        {int.status && (
                          <div className="mt-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`consider-${int._id}`}
                              checked={isConsidering[int._id]}
                              onChange={() => toggleConsiderCandidate(int._id)}
                              className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`consider-${int._id}`} className="ml-2 text-gray-500 text-sm md:text-base flex items-center">
                              <FiCheckSquare className="mr-1" /> Consider this candidate
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InterviewerDashboard;
