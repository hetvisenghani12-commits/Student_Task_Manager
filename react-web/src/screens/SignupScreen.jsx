import { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  IoPersonAdd,
  IoPersonOutline,
  IoMailOutline,
  IoSchoolOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { auth, db } from "../firebase";
import { THEME, ROLE_USER, isValidEmail, showMsg } from "../theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [course, setCourse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      showMsg("Missing Info", "Please fill in all required fields.");
      return;
    }
    if (!isValidEmail(email)) {
      showMsg("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showMsg("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showMsg("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      // Create the matching profile document in Firestore — this is
      // where name/course/role live, since Firebase Auth itself only
      // stores email/password.
      await setDoc(doc(db, "users", cred.user.uid), {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: ROLE_USER, // new signups are always regular users
        course: course.trim() || "Not specified",
        institute: "Parul Institute of Computer Application",
      });
      showMsg("Account Created", "Welcome aboard!");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        showMsg("Account Exists", "An account with this email already exists.");
      } else if (error.code === "auth/weak-password") {
        showMsg("Weak Password", "Password must be at least 6 characters.");
      } else {
        showMsg("Signup Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordToggle = (
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
  );

  return (
    <div className="auth-page">
      <div className="auth-hero auth-hero-signup">
        <div className="auth-logo-circle">
          <IoPersonAdd size={36} color="#FFFFFF" />
        </div>
        <h1 className="auth-hero-title">Create Account</h1>
        <p className="auth-hero-subtitle">Join StudyFlow in seconds</p>
      </div>

      <form className="auth-form-card" onSubmit={handleSignup} noValidate>
        <label className="field-label" htmlFor="signup-name">
          Full Name
        </label>
        <div className="input-with-icon">
          <IoPersonOutline size={18} color={THEME.textMuted} />
          <input
            id="signup-name"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <label className="field-label" htmlFor="signup-email">
          Email Address
        </label>
        <div className="input-with-icon">
          <IoMailOutline size={18} color={THEME.textMuted} />
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="field-label" htmlFor="signup-course">
          Course / Program
        </label>
        <div className="input-with-icon">
          <IoSchoolOutline size={18} color={THEME.textMuted} />
          <input
            id="signup-course"
            placeholder="e.g., BCA Honours"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>

        <label className="field-label" htmlFor="signup-password">
          Password
        </label>
        <div className="input-with-icon">
          <IoLockClosedOutline size={18} color={THEME.textMuted} />
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordToggle}
        </div>

        <label className="field-label" htmlFor="signup-confirm">
          Confirm Password
        </label>
        <div className="input-with-icon">
          <IoLockClosedOutline size={18} color={THEME.textMuted} />
          <input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="primary-btn primary-btn-signup"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
          <IoCheckmarkCircleOutline size={18} />
        </button>

        <div className="auth-footer-row">
          <span>Already have an account? </span>
          <Link to="/" className="auth-footer-link">
            Log In
          </Link>
        </div>
      </form>
    </div>
  );
}
