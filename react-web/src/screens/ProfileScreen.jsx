import { useState } from "react";
import {
  IoShieldCheckmark,
  IoPerson,
  IoMailOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoCreateOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { THEME, ROLE_ADMIN, showMsg } from "../theme";

export default function ProfileScreen({ currentUser, userActions, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [course, setCourse] = useState(currentUser.course);
  const [institute, setInstitute] = useState(currentUser.institute);
  const isAdmin = currentUser.role === ROLE_ADMIN;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await userActions.updateUser(currentUser.uid, { name, course, institute });
      setIsEditing(false);
      showMsg("Success", "Profile updated!");
    } catch (error) {
      showMsg("Error", "Could not update profile. Please try again.");
    }
  };

  const confirmLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) onLogout();
  };

  return (
    <div className="container">
      <div className="profile-header-gradient">
        <div className="avatar-circle">
          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "S"}
        </div>
        <h1 className="profile-name">{currentUser.name}</h1>
        <p className="profile-role">{currentUser.course}</p>
        <div className="role-badge">
          {isAdmin ? <IoShieldCheckmark size={12} /> : <IoPerson size={12} />}
          {isAdmin ? "Administrator" : "Student"}
        </div>
      </div>

      <div className="card info-card">
        {isEditing ? (
          <form onSubmit={handleSaveProfile}>
            <label className="field-label" htmlFor="profile-name">
              Student Name
            </label>
            <input
              id="profile-name"
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="field-label" htmlFor="profile-course">
              Course
            </label>
            <input
              id="profile-course"
              className="text-input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />

            <label className="field-label" htmlFor="profile-institute">
              Institute
            </label>
            <input
              id="profile-institute"
              className="text-input"
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
            />

            <button type="submit" className="submit-btn">
              Save Profile
            </button>
          </form>
        ) : (
          <div>
            <div className="info-row">
              <IoMailOutline size={20} color={THEME.primary} />
              <div className="flex-1">
                <div className="info-label">Email</div>
                <div className="info-val">{currentUser.email}</div>
              </div>
            </div>

            <div className="info-row">
              <IoSchoolOutline size={20} color={THEME.primary} />
              <div className="flex-1">
                <div className="info-label">Course</div>
                <div className="info-val">{currentUser.course}</div>
              </div>
            </div>

            <div className="info-row">
              <IoBusinessOutline size={20} color={THEME.primary} />
              <div className="flex-1">
                <div className="info-label">Institute</div>
                <div className="info-val">{currentUser.institute}</div>
              </div>
            </div>

            <button
              type="button"
              className="edit-toggle-btn"
              onClick={() => setIsEditing(true)}
            >
              <IoCreateOutline size={18} /> Edit Profile Info
            </button>

            <button type="button" className="logout-btn" onClick={confirmLogout}>
              <IoLogOutOutline size={18} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
