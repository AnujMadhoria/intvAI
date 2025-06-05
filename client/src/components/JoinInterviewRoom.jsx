import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const JoinInterviewRoom = ({ roomId, userId }) => {
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io('http://localhost:5000', {
      withCredentials: true
    });

    socket.current.emit('join-room', { roomId, userId });

    socket.current.on('user-joined', ({ userId: newUserId, socketId }) => {
      console.log('User joined:', newUserId, socketId);
      setRemoteSocketId(socketId);
    });

    socket.current.on('offer', async ({ offer, from }) => {
  console.log('Received offer');
  if (!peerConnection.current) await createPeerConnection(from);
  await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.current.createAnswer();
  await peerConnection.current.setLocalDescription(answer);
  socket.current.emit('answer', { answer, to: from });
});


    socket.current.on('answer', async ({ answer }) => {
      console.log('Received answer');
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.current.on('ice-candidate', async ({ candidate }) => {
      console.log('Received ICE candidate');
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    });

    getLocalStream();

    return () => {
      socket.current.disconnect();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId, userId]);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  };

const createPeerConnection = async (targetSocketId) => {
  // Ensure local media is available
  let localStream = localVideoRef.current.srcObject;
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = localStream;
  }

  peerConnection.current = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => {
    peerConnection.current.addTrack(track, localStream);
  });

  peerConnection.current.ontrack = (event) => {
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  peerConnection.current.onicecandidate = (event) => {
    if (event.candidate) {
      socket.current.emit('ice-candidate', {
        candidate: event.candidate,
        to: targetSocketId
      });
    }
  };
};


const callUser = async () => {
  if (!remoteSocketId) return;
  await createPeerConnection(remoteSocketId);
  const offer = await peerConnection.current.createOffer();
  await peerConnection.current.setLocalDescription(offer);
  socket.current.emit('offer', { offer, to: remoteSocketId });
};


 return (
  <div className="flex flex-col gap-4 p-4">
    <h1 className="text-2xl font-bold">Interview Room</h1>
    <div className="flex gap-4">
      <video ref={localVideoRef} autoPlay muted className="w-1/2" />
      <video ref={remoteVideoRef} autoPlay className="w-1/2" />
    </div>

    {/* Only interviewer can see the Call button */}
    {localStorage.getItem('type') === 'interviewer' && remoteSocketId && (
      <button
        onClick={callUser}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Call Candidate
      </button>
    )}

    {/* Call button for interviewer */}
   
  </div>
);

};

export default JoinInterviewRoom;
