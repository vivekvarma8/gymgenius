import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "@phosphor-icons/react";
import { useAuthContext } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-brand-header">
          <BrandLogo size={54} />
          <h1 className="login-title">Gym<span className="brand-accent">Genius</span></h1>
          <p className="login-tagline">AI-Powered Gym Management & Member CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              placeholder="admin@gymgenius.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              placeholder="••••••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Signing in to GymGenius..." : "Sign In to Dashboard"}
          </button>
          {error && <p className="error-text text-center">{error}</p>}
        </form>

        <div className="login-features-list">
          <div className="login-feature-item">
            <CheckCircle size={15} weight="fill" className="feature-check" /> Real-time Plan Analytics
          </div>
          <div className="login-feature-item">
            <CheckCircle size={15} weight="fill" className="feature-check" /> Instant Member Management
          </div>
          <div className="login-feature-item">
            <CheckCircle size={15} weight="fill" className="feature-check" /> Built-in AI Assistant
          </div>
        </div>
      </div>
    </div>
  );
}
