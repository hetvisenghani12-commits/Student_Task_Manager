import { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  IoSchool,
  IoMailOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoArrowForward,
} from "react-icons/io5";
import { auth } from "../firebase";
import { THEME, isValidEmail, showMsg } from "../theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showMsg("Missing Info", "Please enter both email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      showMsg("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      // No need to navigate manually — the root App component listens
      // for the auth state change and switches to the main app.
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        showMsg("Login Failed", "Incorrect email or password.");
      } else if (error.code === "auth/user-not-found") {
        showMsg(
          "Account Not Found",
          "No account exists with this email. Please sign up.",
        );
      } else if (error.code === "auth/too-many-requests") {
        showMsg("Too Many Attempts", "Please wait a moment and try again.");
      } else {
        showMsg("Login Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo-circle">
          <IoSchool size={40} color="#FFFFFF" />
        </div>
        <h1 className="auth-hero-title">StudyFlow</h1>
        <p className="auth-hero-subtitle">Plan smart. Study smarter.</p>
      </div>

      <form className="auth-form-card" onSubmit={handleLogin} noValidate>
        <h2 className="auth-form-title">Welcome Back 👋</h2>
        <p className="auth-form-subtitle">Log in to continue your journey</p>

        <label className="field-label" htmlFor="login-email">
          Email Address
        </label>
        <div className="input-with-icon">
          <IoMailOutline size={18} color={THEME.textMuted} />
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <div className="input-with-icon">
          <IoLockClosedOutline size={18} color={THEME.textMuted} />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <IoEyeOffOutline size={18} color={THEME.textMuted} />
            ) : (
              <IoEyeOutline size={18} color={THEME.textMuted} />
            )}
          </button>
        </div>

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Logging In..." : "Log In"}
          <IoArrowForward size={18} />
        </button>

        <div className="auth-footer-row">
          <span>Don't have an account? </span>
          <Link to="/signup" className="auth-footer-link">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
}
