import { useState } from "react";
import axios from "axios";

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      if (isRegister) {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, {
          name,
          email,
          password
        });

        alert("Registered successfully! Now login.");
        setIsRegister(false);
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
          email,
          password
        });

        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>
          {isRegister ? "Create Account 🚀" : "Welcome Back 👋"}
        </h2>

        {isRegister && (
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Your full name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleAuth}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
          {isRegister
            ? "Already have an account? Login"
            : "New here? Register"}
        </p>
      </div>
    </div>
  );
}

export default Login;