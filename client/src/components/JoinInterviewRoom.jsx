import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiUser, FiUserX, FiMessageSquare, FiSend, FiX } from 'react-icons/fi';

const JoinInterviewRoom = ({ roomId, userId }) => {
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [otherUserJoined, setOtherUserJoined] = useState(false);
  const [otherUserLeft, setOtherUserLeft] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const userType = localStorage.getItem('type'); // 'interviewer' or 'candidate'
  const [showTabSwitchAlert, setShowTabSwitchAlert] = useState(false);

  useEffect(() => {
    socket.current = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.current.emit('join-room', { roomId, userId });

    // Get existing users in room
    socket.current.on('users-in-room', (users) => {
      const otherUsers = users.filter(user => user.userId !== userId);
      if (otherUsers.length > 0) {
        setOtherUserJoined(true);
        setOtherUserLeft(false);
        setRemoteSocketId(otherUsers[0].socketId);
      }
    });
    
    
    // New user joined
    socket.current.on('user-ready', ({ userId: newUserId, socketId }) => {
      if (newUserId !== userId) {
        setOtherUserJoined(true);
        setOtherUserLeft(false);
        setRemoteSocketId(socketId);
      }
    });

    // User left
    socket.current.on('user-left', ({ userId: leftUserId }) => {
      if (leftUserId !== userId) {
        setOtherUserJoined(false);
        setOtherUserLeft(true);
        setRemoteSocketId(null);
        if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
        }
        if (remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
          remoteVideoRef.current.srcObject = null;
        }
      }
    });

    // WebRTC events
    socket.current.on('offer', async ({ offer, from }) => {
      if (!peerConnection.current) await createPeerConnection(from);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.current.emit('answer', { answer, to: from });
    });

    socket.current.on('answer', async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.current.on('ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnection.current && candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    });

    getLocalStream();

    return () => {
      if (socket.current) socket.current.disconnect();
      if (peerConnection.current) peerConnection.current.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, userId]);

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && userType === 'candidate') {
      socket.current.emit('tab-switch', { roomId, from: userId });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [roomId, userId, userType]);


useEffect(() => {
  if (!socket.current) return;

  socket.current.on('candidate-tab-switch', () => {
    if (userType === 'interviewer') {
      setShowTabSwitchAlert(true);
    }
  });

  return () => {
    socket.current.off('candidate-tab-switch');
  };
}, [userType]);


  // Socket message handling
  useEffect(() => {
    if (!socket.current) return;

    // Listen for incoming messages
    socket.current.on('chat-message', ({ from, message }) => {
      setMessages((prev) => [...prev, { from, message }]);
    });

    return () => {
      if (socket.current) {
        socket.current.off('chat-message');
      }
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === '' || !socket.current) return;
    socket.current.emit('chat-message', { roomId, message: newMessage, from: userId });
    setMessages((prev) => [...prev, { from: userId, message: newMessage }]);
    setNewMessage('');
  };

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      setLocalStream(stream);
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  };

  const createPeerConnection = async (targetSocketId) => {
    const stream = localVideoRef.current.srcObject;
    if (!stream) return;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && socket.current) {
        socket.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: targetSocketId
        });
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      if (peerConnection.current.connectionState === 'disconnected') {
        setOtherUserJoined(false);
        setOtherUserLeft(true);
      }
    };
  };

  const callUser = async () => {
    if (!remoteSocketId) return;
    if (!peerConnection.current) await createPeerConnection(remoteSocketId);
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.current.emit('offer', { offer, to: remoteSocketId });
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setOtherUserJoined(false);
    setOtherUserLeft(true);
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-100 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Interview Room</h1>
      {showTabSwitchAlert && userType === 'interviewer' && (
  <div className="fixed bottom-4 right-4 bg-yellow-200 border border-yellow-400 text-yellow-800 p-2 rounded shadow">
    <p className="mb-2 font-medium">Candidate is switching the tab!</p>
    <button
      onClick={() => setShowTabSwitchAlert(false)}
      className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-1 rounded"
    >
      Dismiss
    </button>
  </div>
)}

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* Local Video */}
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="h-full w-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <FiUser className="text-white text-6xl" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}
            >
              {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white`}
            >
              {isVideoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
          {otherUserJoined ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-800 flex flex-col items-center justify-center text-white">
              {otherUserLeft ? (
                <>
                  <FiUserX className="text-6xl mb-4 text-red-400" />
                  <p className="text-xl">The {userType === 'interviewer' ? 'candidate' : 'interviewer'} has left</p>
                </>
              ) : (
                <>
                  <div className="animate-pulse">
                    <FiUser className="text-6xl mb-4 text-blue-400" />
                  </div>
                  <p className="text-xl">
                    Waiting for {userType === 'interviewer' ? 'candidate' : 'interviewer'} to join...
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status and Controls */}
      <div className="mt-4 flex flex-col items-center">
        <div className="text-center mb-4">
          {otherUserJoined ? (
            <div className="flex items-center justify-center text-green-600">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <p className="font-medium">
                {userType === 'interviewer' ? 'Candidate is connected' : 'Interviewer is connected'}
              </p>
            </div>
          ) : otherUserLeft ? (
            <div className="flex items-center justify-center text-red-600">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              <p className="font-medium">
                {userType === 'interviewer' ? 'Candidate has left' : 'Interviewer has left'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center text-yellow-600">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
              <p className="font-medium">
                Waiting for {userType === 'interviewer' ? 'candidate' : 'interviewer'}...
              </p>
            </div>
          )}
        </div>
        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow"
        >
          <FiMessageSquare size={20} />
        </button>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="fixed top-0 left-0 h-full flex  resize-x overflow-auto    bg-white shadow-lg z-50  flex-col" style={{ minWidth: '200px', maxWidth: '400px' }}>
            <div className="flex justify-between items-center p-2 bg-blue-600 text-white">
              <h2 className="text-lg font-semibold">Chat</h2>
              <button onClick={() => setIsChatOpen(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-md whitespace-pre-wrap  ${msg.from === userId ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'
                    }break-words`}
                >
                  {msg.message}
                </div>
              ))}
            </div>
            <div className="flex p-2 border-t">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2 border rounded resize-none overflow-y-auto"
                placeholder="Type a message..."
                rows={1}
              />

              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r"
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        )}
        {/* Call controls */}
        <div className="flex gap-4">
          {userType === 'interviewer' && otherUserJoined && (
            <button
              onClick={callUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2"
            >
              <FiVideo className="inline" /> Start Call
            </button>
          )}

          <button
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2"
          >
            <FiPhone className="inline" /> End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinInterviewRoom;