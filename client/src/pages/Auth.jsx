import { useState } from 'react';
import axios from 'axios';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '', email: '', password: '', type: 'candidate'
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
  e.preventDefault();
  const url = `http://localhost:5000/api/auth/${isLogin ? 'login' : 'signup'}`;

  try {
    const res = await axios.post(url, form); // Removed headers here ✅

    // Save token and user type after successful login/signup
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('type', res.data.user.type);

    // Redirect based on user type
    const userType = res.data.user.type;
    window.location.href = userType === 'candidate' ? '/candidate' : '/interviewer';
  } catch (err) {
    alert(err.response?.data?.error || 'Something went wrong');
  }
};


  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <input name="name" placeholder="Full Name" onChange={handleChange} className="input" required />
            <select name="type" onChange={handleChange} className="input">
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </>
        )}
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="input" required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="input" required />
        <button type="submit" className="btn">{isLogin ? 'Login' : 'Sign Up'}</button>
        <p onClick={() => setIsLogin(!isLogin)} className="text-blue-600 cursor-pointer text-sm">
          {isLogin ? 'No account? Sign Up' : 'Have an account? Login'}
        </p>
      </form>
    </div>
  );
}

export default Auth;
