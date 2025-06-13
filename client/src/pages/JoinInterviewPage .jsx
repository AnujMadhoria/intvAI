import { useParams } from 'react-router-dom';
import JoinInterviewRoom from '../components/JoinInterviewRoom';

const JoinInterviewPage = () => {
  const { roomId } = useParams();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')); // example

  if (!token || !user) {
    // Redirect or show error
    return <div>Not authorized. Please login.</div>;
  }
  console.log('Joining room:', roomId, 'User:', user);
  console.log(user._id  );
  return (
    <JoinInterviewRoom roomId={roomId} userId={user._id} />
  );
};

export default JoinInterviewPage;
