import { useState } from "react";
import axios from "axios";
import { Brain, Mail, Lock } from "lucide-react";
import API_BASE_URL from "../api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@deskmind.ai");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("deskmind_token", response.data.token);
      localStorage.setItem("deskmind_user", JSON.stringify(response.data.user));

      onLogin(response.data.user);
    } catch (error) {
      console.error(error);
      alert("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Brain size={34} />
        </div>

        <h1>DeskMindAI</h1>
        <p>Admin access for the enterprise service desk dashboard</p>

        <div className="login-field">
          <label>Email</label>
          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              placeholder="admin@deskmind.ai"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="login-field">
          <label>Password</label>
          <div className="login-input-wrap">
            <Lock size={18} />
            <input
              type="password"
              value={password}
              placeholder="admin123"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="demo-login-note">
          Demo Login: admin@deskmind.ai / admin123
        </div>
      </div>
    </div>
  );
}

export default Login;