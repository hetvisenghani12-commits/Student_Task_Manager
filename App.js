import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// ---------------------------------------------
// THEME — "Ink & Marigold": an academic-planner palette.
// Deep ink for structure and trust, warm marigold for energy
// and action, coral/mint as clear semantic signals.
// ---------------------------------------------
const THEME = {
  primary: "#2A2160", // ink — headers, primary actions
  primaryDark: "#1B1544", // deeper ink — pressed/dark states
  primaryLight: "#ECEAFB", // pale ink tint — soft backgrounds
  secondary: "#1AA398", // mint — secondary actions
  accent: "#FFB100", // marigold — highlights, energy
  background: "#F6F5FA", // cool paper background
  surface: "#FFFFFF",
  textDark: "#211A3D",
  textMuted: "#8B87A6",
  border: "#E9E7F4",
  success: "#1AA398",
  warning: "#FFB100",
  danger: "#E14545",
  dangerBg: "#FDE7E7",
  gradientStart: "#2A2160",
  gradientEnd: "#4A3B8C",
};

const PRIORITY_THEMES = {
  High: { bg: "#FDE7E7", text: "#E14545" },
  Medium: { bg: "#FFF3D6", text: "#B9790A" },
  Low: { bg: "#E4F5F3", text: "#1AA398" },
};

const ROLE_ADMIN = "admin";
const ROLE_USER = "user";

// ---------------------------------------------
// Helpers
// ---------------------------------------------
const formatDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
  }
  return new Date();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const showMsg = (title, msg) => {
  if (Platform.OS === "web") alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

// Responsive breakpoints: phone < 700, tablet 700-999, desktop >= 1000.
// Used to widen tap targets, cap reading width, and scale a few key
// font sizes so the same screens feel native on a phone and a laptop.
function useBreakpoint() {
  const { width } = useWindowDimensions();
  if (width >= 1000) return "desktop";
  if (width >= 700) return "tablet";
  return "phone";
}

// Shared soft elevation so cards read as gently lifted paper rather
// than flat boxes with a hard outline.
const CARD_SHADOW = {
  shadowColor: "#2A2160",
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 2,
};

// ---------------------------------------------
// GRADIENT HEADER — reusable premium header block
// ---------------------------------------------
function GradientHeader({ title, subtitle, icon }) {
  return (
    <LinearGradient
      colors={[THEME.gradientStart, THEME.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientHeader}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.gradientTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.gradientSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {icon ? (
        <View style={styles.gradientIconWrap}>
          <Ionicons name={icon} size={26} color="#FFFFFF" />
        </View>
      ) : null}
    </LinearGradient>
  );
}

// Reusable Previous/Next pagination bar. Compact on phones, roomier
// on tablet/desktop. Hidden automatically when there's only one page.
function Pagination({ currentPage, totalPages, onPrev, onNext }) {
  const breakpoint = useBreakpoint();
  const compact = breakpoint === "phone";

  if (totalPages <= 1) return null;

  return (
    <View
      style={[styles.paginationBar, compact && styles.paginationBarCompact]}
    >
      <TouchableOpacity
        style={[
          styles.paginationBtn,
          compact && styles.paginationBtnCompact,
          currentPage === 1 && styles.paginationBtnDisabled,
        ]}
        onPress={onPrev}
        disabled={currentPage === 1}
      >
        <Ionicons
          name="chevron-back"
          size={compact ? 16 : 18}
          color={currentPage === 1 ? THEME.textMuted : THEME.primary}
        />
        <Text
          style={[
            styles.paginationBtnText,
            compact && styles.paginationBtnTextCompact,
            currentPage === 1 && styles.paginationBtnTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.paginationPageText,
          compact && styles.paginationPageTextCompact,
        ]}
      >
        Page {currentPage} of {totalPages}
      </Text>

      <TouchableOpacity
        style={[
          styles.paginationBtn,
          compact && styles.paginationBtnCompact,
          currentPage === totalPages && styles.paginationBtnDisabled,
        ]}
        onPress={onNext}
        disabled={currentPage === totalPages}
      >
        <Text
          style={[
            styles.paginationBtnText,
            compact && styles.paginationBtnTextCompact,
            currentPage === totalPages && styles.paginationBtnTextDisabled,
          ]}
        >
          Next
        </Text>
        <Ionicons
          name="chevron-forward"
          size={compact ? 16 : 18}
          color={currentPage === totalPages ? THEME.textMuted : THEME.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

// ===============================================
// AUTH — LOGIN SCREEN
// ===============================================
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientEnd]}
        style={styles.authHero}
      >
        <View style={styles.authLogoCircle}>
          <Ionicons name="school" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.authHeroTitle}>StudyFlow</Text>
        <Text style={styles.authHeroSubtitle}>Plan smart. Study smarter.</Text>
      </LinearGradient>

      <View style={styles.authFormCard}>
        <Text style={styles.authFormTitle}>Welcome Back 👋</Text>
        <Text style={styles.authFormSubtitle}>
          Log in to continue your journey
        </Text>

        <Text style={styles.fieldLabel}>Email Address</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="mail-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="you@example.com"
            placeholderTextColor={THEME.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={THEME.textMuted}
          />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="••••••••"
            placeholderTextColor={THEME.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
          <LinearGradient
            colors={[THEME.gradientStart, THEME.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.authFooterRow}>
          <Text style={styles.authFooterText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.authFooterLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ===============================================
// AUTH — SIGNUP SCREEN
// ===============================================
function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [course, setCourse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
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
      // No manual navigation needed — onAuthStateChanged in the root
      // App component picks this up automatically.
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[THEME.accent, THEME.gradientStart]}
        style={styles.authHero}
      >
        <View style={styles.authLogoCircle}>
          <Ionicons name="person-add" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.authHeroTitle}>Create Account</Text>
        <Text style={styles.authHeroSubtitle}>Join StudyFlow in seconds</Text>
      </LinearGradient>

      <View style={styles.authFormCard}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="person-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="Your full name"
            placeholderTextColor={THEME.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.fieldLabel}>Email Address</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="mail-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="you@example.com"
            placeholderTextColor={THEME.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.fieldLabel}>Course / Program</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="school-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="e.g., BCA Honours"
            placeholderTextColor={THEME.textMuted}
            value={course}
            onChangeText={setCourse}
          />
        </View>

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={THEME.textMuted}
          />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="At least 6 characters"
            placeholderTextColor={THEME.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Confirm Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={THEME.textMuted}
          />
          <TextInput
            style={styles.inputWithIconField}
            placeholder="Re-enter password"
            placeholderTextColor={THEME.textMuted}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup}>
          <LinearGradient
            colors={[THEME.accent, THEME.gradientStart]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.authFooterRow}>
          <Text style={styles.authFooterText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.authFooterLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ===============================================
// AUTH NAVIGATOR
// ===============================================
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {(props) => <LoginScreen {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Signup">
        {(props) => <SignupScreen {...props} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

// ===============================================
// 1. HOME SCREEN
// ===============================================
function HomeScreen({ tasks, currentUser, navigation }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <GradientHeader
        title={`Hi, ${currentUser.name.split(" ")[0]} 👋`}
        subtitle={
          currentUser.role === ROLE_ADMIN
            ? "Admin Dashboard Overview"
            : "Here is your study roadmap"
        }
        icon={currentUser.role === ROLE_ADMIN ? "shield-checkmark" : "rocket"}
      />

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressLabel}>Overall Completion</Text>
            <Text style={styles.progressSubLabel}>
              {completed} of {total} tasks finished
            </Text>
          </View>
          <Text style={styles.progressValue}>{progressPercent}%</Text>
        </View>
        <View style={styles.trackBar}>
          <View style={[styles.fillBar, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <View style={styles.gridContainer}>
        <View style={[styles.metricCard, { borderLeftColor: THEME.primary }]}>
          <Ionicons name="journal-outline" size={22} color={THEME.primary} />
          <Text style={styles.metricNumber}>{total}</Text>
          <Text style={styles.metricTitle}>Total Tasks</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: THEME.warning }]}>
          <Ionicons name="time-outline" size={22} color={THEME.warning} />
          <Text style={[styles.metricNumber, { color: THEME.warning }]}>
            {pending}
          </Text>
          <Text style={styles.metricTitle}>Pending</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: THEME.success }]}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={22}
            color={THEME.success}
          />
          <Text style={[styles.metricNumber, { color: THEME.success }]}>
            {completed}
          </Text>
          <Text style={styles.metricTitle}>Completed</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>
        {currentUser.role === ROLE_ADMIN
          ? "All Users' Tasks"
          : "Upcoming Tasks"}
      </Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={40} color={THEME.textMuted} />
          <Text style={styles.emptyStateTitle}>All caught up!</Text>
          <Text style={styles.emptyStateText}>
            Add new tasks to organize your schedule.
          </Text>
        </View>
      ) : (
        tasks.slice(0, 5).map((task) => (
          <View key={task.id} style={styles.taskListItem}>
            <View style={{ flex: 1 }}>
              <View style={styles.tagGroup}>
                <View
                  style={[
                    styles.pPill,
                    { backgroundColor: PRIORITY_THEMES[task.priority]?.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.pText,
                      { color: PRIORITY_THEMES[task.priority]?.text },
                    ]}
                  >
                    {task.priority}
                  </Text>
                </View>
                <Text style={styles.cPill}>{task.category}</Text>
                {currentUser.role === ROLE_ADMIN && task.owner && (
                  <Text style={styles.ownerPill}>{task.owner}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.itemTitle,
                  task.completed && styles.strikethrough,
                ]}
              >
                {task.title}
              </Text>
              <Text style={styles.itemDate}>📅 Due: {task.date}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ===============================================
// 2. TASKS SCREEN
// ===============================================
function TasksScreen({ tasks, taskActions, currentUser, navigation }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const breakpoint = useBreakpoint();
  const itemsPerPage =
    breakpoint === "phone" ? 4 : breakpoint === "tablet" ? 6 : 8;

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Study");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDateObj, setEditDateObj] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const categories = ["All", "Study", "Assignment", "Personal"];
  const priorities = ["Low", "Medium", "High"];

  const isAdmin = currentUser.role === ROLE_ADMIN;

  const visibleTasks = isAdmin
    ? tasks
    : tasks.filter((t) => t.owner === currentUser.email);

  const toggleTask = (id, completed) => {
    taskActions
      .updateTask(id, { completed: !completed })
      .catch((e) => showMsg("Error", e.message));
  };

  const deleteTask = (id) => {
    const doDelete = () =>
      taskActions.deleteTask(id).catch((e) => showMsg("Error", e.message));
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this task?"))
        doDelete();
    } else {
      Alert.alert("Delete Task", "Are you sure you want to delete this item?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditDateObj(parseDateString(task.date));
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setShowEditDatePicker(false);
  };

  const saveTaskEdit = (id) => {
    if (!editTitle.trim()) {
      showMsg("Error", "Title cannot be empty.");
      return;
    }
    taskActions
      .updateTask(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || "No detailed notes added.",
        category: editCategory,
        priority: editPriority,
        date: formatDateString(editDateObj),
      })
      .catch((e) => showMsg("Error", e.message));
    setEditingTaskId(null);
    setShowEditDatePicker(false);
  };

  const filteredTasks = visibleTasks.filter((t) => {
    const query = search.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query);
    const matchesCat = selectedCat === "All" || t.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenHeader}>
        {isAdmin ? "All Tasks 🗂️" : "My Workspace 📋"}
      </Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.textMuted} />
        <TextInput
          style={styles.searchField}
          placeholder="Search task title..."
          placeholderTextColor={THEME.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCat === cat && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCat === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color={THEME.textMuted} />
          <Text style={styles.emptyStateTitle}>No matching tasks</Text>
        </View>
      ) : (
        paginatedTasks.map((task) => (
          <View key={task.id} style={styles.detailedCard}>
            {editingTaskId === task.id ? (
              <View>
                <Text style={styles.editSectionTitle}>Editing Task ✏️</Text>

                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                />

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.choiceGroup}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.choiceBtn,
                        editPriority === p && {
                          backgroundColor: PRIORITY_THEMES[p].bg,
                          borderColor: PRIORITY_THEMES[p].text,
                        },
                      ]}
                      onPress={() => setEditPriority(p)}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          editPriority === p && {
                            color: PRIORITY_THEMES[p].text,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.choiceGroup}>
                  {["Study", "Assignment", "Personal"].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.choiceBtn,
                        editCategory === c && styles.choiceBtnActive,
                      ]}
                      onPress={() => setEditCategory(c)}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          editCategory === c && styles.choiceTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Due Date Calendar 📅</Text>
                {Platform.OS === "web" ? (
                  <View style={styles.webDateContainer}>
                    <input
                      type="date"
                      style={styles.webDatePickerInput}
                      value={formatDateString(editDateObj)}
                      onChange={(e) =>
                        e.target.value &&
                        setEditDateObj(new Date(e.target.value))
                      }
                    />
                  </View>
                ) : (
                  <View>
                    <TouchableOpacity
                      style={styles.datePickerTrigger}
                      onPress={() => setShowEditDatePicker(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={THEME.primary}
                      />
                      <Text style={styles.datePickerText}>
                        {formatDateString(editDateObj)}
                      </Text>
                      <Text style={styles.changeTag}>Change Date</Text>
                    </TouchableOpacity>

                    {showEditDatePicker && (
                      <DateTimePicker
                        value={editDateObj}
                        mode="date"
                        display="calendar"
                        onChange={(event, date) => {
                          setShowEditDatePicker(Platform.OS === "ios");
                          if (date) setEditDateObj(date);
                        }}
                      />
                    )}
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: THEME.success,
                        flex: 1,
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => saveTaskEdit(task.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: THEME.textMuted,
                        flex: 1,
                        justifyContent: "center",
                      },
                    ]}
                    onPress={cancelEditing}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.tagGroup}>
                  <View
                    style={[
                      styles.pPill,
                      { backgroundColor: PRIORITY_THEMES[task.priority]?.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pText,
                        { color: PRIORITY_THEMES[task.priority]?.text },
                      ]}
                    >
                      {task.priority} Priority
                    </Text>
                  </View>
                  <Text style={styles.cPill}>{task.category}</Text>
                  {isAdmin && task.owner && (
                    <Text style={styles.ownerPill}>👤 {task.owner}</Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.itemTitle,
                    task.completed && styles.strikethrough,
                  ]}
                >
                  {task.title}
                </Text>
                <Text style={styles.itemDesc}>{task.description}</Text>
                <Text style={styles.itemDate}>📅 Due Date: {task.date}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: task.completed
                          ? THEME.textMuted
                          : THEME.primary,
                      },
                    ]}
                    onPress={() => toggleTask(task.id, task.completed)}
                  >
                    <Ionicons
                      name={
                        task.completed
                          ? "refresh-outline"
                          : "checkmark-circle-outline"
                      }
                      size={16}
                      color="#FFF"
                    />
                    <Text style={styles.actionBtnText}>
                      {task.completed ? " Undo" : " Complete"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: THEME.secondary },
                    ]}
                    onPress={() => startEditing(task)}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: THEME.dangerBg },
                    ]}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={THEME.danger}
                    />
                    <Text
                      style={[styles.actionBtnText, { color: THEME.danger }]}
                    >
                      {" "}
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      />
    </ScrollView>
  );
}

// ===============================================
// 3. ADD TASK SCREEN
// ===============================================
function AddTaskScreen({ taskActions, navigation, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Study");
  const [saving, setSaving] = useState(false);

  const priorities = ["Low", "Medium", "High"];
  const categories = ["Study", "Assignment", "Personal"];

  const handleNativeDateChange = (event, date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) setSelectedDateObj(date);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showMsg("Required", "Please enter a task title.");
      return;
    }

    const newTask = {
      title: title.trim(),
      description: description.trim() || "No detailed notes added.",
      date: formatDateString(selectedDateObj),
      priority,
      category,
      completed: false,
      owner: currentUser.email,
    };

    setSaving(true);
    try {
      await taskActions.addTask(newTask);
      setTitle("");
      setDescription("");
      setSelectedDateObj(new Date());
      setPriority("Medium");
      setCategory("Study");
      showMsg("Success", "Task added to schedule!");
      navigation.navigate("Tasks");
    } catch (e) {
      showMsg("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenHeader}>Create New Task ✍️</Text>

      <View style={styles.formContainer}>
        <Text style={styles.fieldLabel}>Task Title *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Study Operating Systems"
          placeholderTextColor={THEME.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Add details, links, or notes..."
          placeholderTextColor={THEME.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.fieldLabel}>Priority Level</Text>
        <View style={styles.choiceGroup}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.choiceBtn,
                priority === p && {
                  backgroundColor: PRIORITY_THEMES[p].bg,
                  borderColor: PRIORITY_THEMES[p].text,
                },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text
                style={[
                  styles.choiceText,
                  priority === p && {
                    color: PRIORITY_THEMES[p].text,
                    fontWeight: "700",
                  },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.choiceGroup}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.choiceBtn,
                category === c && styles.choiceBtnActive,
              ]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.choiceText,
                  category === c && styles.choiceTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Select Due Date Calendar 📅</Text>
        {Platform.OS === "web" ? (
          <View style={styles.webDateContainer}>
            <input
              type="date"
              style={styles.webDatePickerInput}
              value={formatDateString(selectedDateObj)}
              onChange={(e) =>
                e.target.value && setSelectedDateObj(new Date(e.target.value))
              }
            />
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.datePickerTrigger}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={THEME.primary}
              />
              <Text style={styles.datePickerText}>
                {formatDateString(selectedDateObj)}
              </Text>
              <Text style={styles.changeTag}>Open Calendar</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={selectedDateObj}
                mode="date"
                display="calendar"
                onChange={handleNativeDateChange}
              />
            )}
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
          <LinearGradient
            colors={[THEME.gradientStart, THEME.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradient}
          >
            <Text style={styles.submitBtnText}>Save Task to Calendar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ===============================================
// 4. COMPLETED SCREEN
// ===============================================
function CompletedScreen({ tasks, taskActions, currentUser, navigation }) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const scoped = isAdmin
    ? tasks
    : tasks.filter((t) => t.owner === currentUser.email);
  const completedList = scoped.filter((t) => t.completed);

  const deleteTask = (id) => {
    const doDelete = () =>
      taskActions.deleteTask(id).catch((e) => showMsg("Error", e.message));
    if (Platform.OS === "web") {
      if (window.confirm("Remove this completed task?")) doDelete();
    } else {
      Alert.alert("Delete", "Remove this completed task?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenHeader}>Completed Tasks 🎉</Text>

      {completedList.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={44}
            color={THEME.textMuted}
          />
          <Text style={styles.emptyStateTitle}>No finished tasks yet</Text>
          <Text style={styles.emptyStateText}>
            Mark tasks complete to see history.
          </Text>
        </View>
      ) : (
        completedList.map((task) => (
          <View key={task.id} style={styles.completedCardItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cPill}>{task.category}</Text>
              <Text style={styles.completedTitle}>✓ {task.title}</Text>
              <Text style={styles.itemDesc}>{task.description}</Text>
              <Text style={styles.itemDate}>Completed Due: {task.date}</Text>
              {isAdmin && task.owner && (
                <Text style={styles.ownerPill}>👤 {task.owner}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteIconBtn}
              onPress={() => deleteTask(task.id)}
            >
              <Ionicons name="trash-outline" size={20} color={THEME.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ===============================================
// 5. PROFILE SCREEN (with Logout)
// ===============================================
function ProfileScreen({ currentUser, userActions, onLogout, navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [course, setCourse] = useState(currentUser.course);
  const [institute, setInstitute] = useState(currentUser.institute);

  const handleSaveProfile = async () => {
    try {
      await userActions.updateUser(currentUser.uid, {
        name,
        course,
        institute,
      });
      setIsEditing(false);
      showMsg("Success", "Profile updated!");
    } catch (error) {
      showMsg("Error", "Could not update profile. Please try again.");
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) onLogout();
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: onLogout },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[THEME.gradientStart, THEME.gradientEnd]}
        style={styles.profileHeaderGradient}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "S"}
          </Text>
        </View>
        <Text style={styles.profileName}>{currentUser.name}</Text>
        <Text style={styles.profileRole}>{currentUser.course}</Text>
        <View style={styles.roleBadge}>
          <Ionicons
            name={
              currentUser.role === ROLE_ADMIN ? "shield-checkmark" : "person"
            }
            size={12}
            color="#FFF"
          />
          <Text style={styles.roleBadgeText}>
            {currentUser.role === ROLE_ADMIN ? "Administrator" : "Student"}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.infoCard}>
        {isEditing ? (
          <View>
            <Text style={styles.fieldLabel}>Student Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Course</Text>
            <TextInput
              style={styles.textInput}
              value={course}
              onChangeText={setCourse}
            />

            <Text style={styles.fieldLabel}>Institute</Text>
            <TextInput
              style={styles.textInput}
              value={institute}
              onChangeText={setInstitute}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSaveProfile}
            >
              <LinearGradient
                colors={[THEME.gradientStart, THEME.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                <Text style={styles.submitBtnText}>Save Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={THEME.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoVal}>{currentUser.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color={THEME.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoVal}>{currentUser.course}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={20}
                color={THEME.primary}
              />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Institute</Text>
                <Text style={styles.infoVal}>{currentUser.institute}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#FFF" />
              <Text style={styles.editToggleText}>Edit Profile Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={18} color={THEME.danger} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ===============================================
// 6. ADMIN — USER MANAGEMENT SCREEN (admin-only tab)
// ===============================================
function AdminUsersScreen({
  users,
  userActions,
  tasks,
  currentUser,
  navigation,
}) {
  const toggleRole = async (u) => {
    if (u.uid === currentUser.uid) {
      showMsg("Not Allowed", "You cannot change your own role.");
      return;
    }
    try {
      await userActions.updateUser(u.uid, {
        role: u.role === ROLE_ADMIN ? ROLE_USER : ROLE_ADMIN,
      });
    } catch (error) {
      showMsg("Error", "Could not update role. Please try again.");
    }
  };

  const deleteUser = (u) => {
    if (u.uid === currentUser.uid) {
      showMsg("Not Allowed", "You cannot delete your own account.");
      return;
    }
    const doDelete = async () => {
      try {
        await userActions.deleteUser(u.uid);
      } catch (error) {
        showMsg("Error", "Could not remove this user. Please try again.");
      }
    };
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Remove this user's profile? (Their login will still exist, but their profile data will be gone.)",
        )
      )
        doDelete();
    } else {
      Alert.alert(
        "Remove User",
        "Remove this user's profile? Their login will still exist, but their profile data will be gone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <GradientHeader
        title="User Management 🛡️"
        subtitle={`${users.length} registered accounts`}
        icon="people"
      />

      {users.map((u) => {
        const userTaskCount = tasks.filter((t) => t.owner === u.email).length;
        return (
          <View key={u.uid} style={styles.userCard}>
            <View style={styles.userCardTop}>
              <View style={styles.userAvatarSmall}>
                <Text style={styles.userAvatarSmallText}>
                  {u.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userCardName}>{u.name}</Text>
                <Text style={styles.userCardEmail}>{u.email}</Text>
              </View>
              <View
                style={[
                  styles.roleTag,
                  {
                    backgroundColor:
                      u.role === ROLE_ADMIN ? THEME.primaryLight : "#F0F0F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleTagText,
                    {
                      color:
                        u.role === ROLE_ADMIN
                          ? THEME.primaryDark
                          : THEME.textMuted,
                    },
                  ]}
                >
                  {u.role === ROLE_ADMIN ? "Admin" : "User"}
                </Text>
              </View>
            </View>

            <Text style={styles.userCardMeta}>
              {u.course} · {userTaskCount} task{userTaskCount !== 1 ? "s" : ""}
            </Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: THEME.secondary },
                ]}
                onPress={() => toggleRole(u)}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={16}
                  color="#FFF"
                />
                <Text style={styles.actionBtnText}>
                  {u.role === ROLE_ADMIN ? " Make User" : " Make Admin"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: THEME.dangerBg },
                ]}
                onPress={() => deleteUser(u)}
              >
                <Ionicons name="trash-outline" size={16} color={THEME.danger} />
                <Text style={[styles.actionBtnText, { color: THEME.danger }]}>
                  {" "}
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ===============================================
// 7. NOTES SCREEN — quick notes with an Important flag
// ===============================================
function NotesScreen({ notes, noteActions, currentUser, navigation }) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const visibleNotes = isAdmin
    ? notes
    : notes.filter((n) => n.owner === currentUser.email);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteImportant, setNoteImportant] = useState(false);

  const [search, setSearch] = useState("");
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const breakpoint = useBreakpoint();
  const itemsPerPage =
    breakpoint === "phone" ? 4 : breakpoint === "tablet" ? 6 : 8;

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImportant, setEditImportant] = useState(false);

  const addNote = async () => {
    if (!noteTitle.trim()) {
      showMsg("Required", "Please enter a note title.");
      return;
    }
    try {
      await noteActions.addNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        important: noteImportant,
        owner: currentUser.email,
        createdAt: formatDateString(new Date()),
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteImportant(false);
      showMsg(
        "Saved",
        noteImportant ? "Added to Important Notes." : "Note saved.",
      );
    } catch (error) {
      showMsg("Error", "Could not save the note. Please try again.");
    }
  };

  const toggleImportant = (note) => {
    noteActions
      .updateNote(note.id, { important: !note.important })
      .catch(() => {
        showMsg("Error", "Could not update the note. Please try again.");
      });
  };

  const deleteNote = (id) => {
    const doDelete = async () => {
      try {
        await noteActions.deleteNote(id);
      } catch (error) {
        showMsg("Error", "Could not delete the note. Please try again.");
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this note?")) doDelete();
    } else {
      Alert.alert("Delete Note", "Delete this note?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditImportant(note.important);
  };

  const cancelEditing = () => setEditingNoteId(null);

  const saveNoteEdit = async (id) => {
    if (!editTitle.trim()) {
      showMsg("Error", "Title cannot be empty.");
      return;
    }
    try {
      await noteActions.updateNote(id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        important: editImportant,
      });
      setEditingNoteId(null);
    } catch (error) {
      showMsg("Error", "Could not save changes. Please try again.");
    }
  };

  const filteredNotes = visibleNotes
    .filter((n) => {
      const query = search.toLowerCase();
      const matchesSearch =
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query);
      const matchesImportant = !showImportantOnly || n.important;
      return matchesSearch && matchesImportant;
    })
    .sort((a, b) => (b.important === a.important ? 0 : b.important ? 1 : -1));

  const importantCount = visibleNotes.filter((n) => n.important).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotes.length / itemsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotes = filteredNotes.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showImportantOnly]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <GradientHeader
        title="Notes 🗒️"
        subtitle={`${importantCount} marked important`}
        icon="star"
      />

      <View style={styles.formContainer}>
        <Text style={styles.editSectionTitle}>Quick Note</Text>

        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Exam syllabus reminders"
          placeholderTextColor={THEME.textMuted}
          value={noteTitle}
          onChangeText={setNoteTitle}
        />

        <Text style={styles.fieldLabel}>Note</Text>
        <TextInput
          style={[styles.textInput, styles.noteContentInput]}
          placeholder="Write your note here..."
          placeholderTextColor={THEME.textMuted}
          value={noteContent}
          onChangeText={setNoteContent}
          multiline
        />

        <TouchableOpacity
          style={styles.importantToggleRow}
          onPress={() => setNoteImportant(!noteImportant)}
        >
          <Ionicons
            name={noteImportant ? "star" : "star-outline"}
            size={20}
            color={noteImportant ? THEME.accent : THEME.textMuted}
          />
          <Text style={styles.importantToggleText}>Mark as Important</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={addNote}>
          <LinearGradient
            colors={[THEME.gradientStart, THEME.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradient}
          >
            <Text style={styles.submitBtnText}>Save Note</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.textMuted} />
        <TextInput
          style={styles.searchField}
          placeholder="Search notes..."
          placeholderTextColor={THEME.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.filterChip,
          showImportantOnly && styles.filterChipActive,
          { marginBottom: 16, alignSelf: "flex-start" },
        ]}
        onPress={() => setShowImportantOnly(!showImportantOnly)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            name="star"
            size={12}
            color={showImportantOnly ? "#FFFFFF" : THEME.accent}
          />
          <Text
            style={[
              styles.filterChipText,
              showImportantOnly && styles.filterChipTextActive,
            ]}
          >
            Important Notes Only
          </Text>
        </View>
      </TouchableOpacity>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={40}
            color={THEME.textMuted}
          />
          <Text style={styles.emptyStateTitle}>No notes yet</Text>
          <Text style={styles.emptyStateText}>
            Write your first note above.
          </Text>
        </View>
      ) : (
        paginatedNotes.map((note) => (
          <View
            key={note.id}
            style={[
              styles.noteCard,
              note.important && styles.noteCardImportant,
            ]}
          >
            {editingNoteId === note.id ? (
              <View>
                <Text style={styles.editSectionTitle}>Editing Note ✏️</Text>

                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />

                <Text style={styles.fieldLabel}>Note</Text>
                <TextInput
                  style={[styles.textInput, styles.noteContentInput]}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                />

                <TouchableOpacity
                  style={styles.importantToggleRow}
                  onPress={() => setEditImportant(!editImportant)}
                >
                  <Ionicons
                    name={editImportant ? "star" : "star-outline"}
                    size={20}
                    color={editImportant ? THEME.accent : THEME.textMuted}
                  />
                  <Text style={styles.importantToggleText}>
                    Mark as Important
                  </Text>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: THEME.success,
                        flex: 1,
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => saveNoteEdit(note.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: THEME.textMuted,
                        flex: 1,
                        justifyContent: "center",
                      },
                    ]}
                    onPress={cancelEditing}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.noteCardTop}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <TouchableOpacity onPress={() => toggleImportant(note)}>
                    <Ionicons
                      name={note.important ? "star" : "star-outline"}
                      size={22}
                      color={note.important ? THEME.accent : THEME.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {note.content ? (
                  <Text style={styles.noteContent}>{note.content}</Text>
                ) : null}

                <View style={styles.tagGroup}>
                  <Text style={styles.itemDate}>📅 {note.createdAt}</Text>
                  {isAdmin && note.owner && (
                    <Text style={styles.ownerPill}>👤 {note.owner}</Text>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: THEME.secondary },
                    ]}
                    onPress={() => startEditing(note)}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}> Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: THEME.dangerBg },
                    ]}
                    onPress={() => deleteNote(note.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={THEME.danger}
                    />
                    <Text
                      style={[styles.actionBtnText, { color: THEME.danger }]}
                    >
                      {" "}
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      />
    </ScrollView>
  );
}

// ===============================================
// MAIN APP TABS (post-login)
// ===============================================
function AppTabs({
  tasks,
  notes,
  users,
  taskActions,
  noteActions,
  userActions,
  currentUser,
  onLogout,
}) {
  const isAdmin = currentUser.role === ROLE_ADMIN;
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === "phone";

  // Shorter labels on phone so 6-7 tabs fit without crowding or wrapping.
  const shortLabels = {
    Home: "Home",
    Tasks: "Tasks",
    "Add Task": "Add",
    Completed: "Done",
    Notes: "Notes",
    Users: "Users",
    Profile: "Profile",
  };

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: THEME.background }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { paddingVertical: isPhone ? 2 : 4 },
        tabBarLabelStyle: {
          fontSize: isPhone ? 9 : 11,
          fontWeight: "700",
          marginTop: -2,
        },
        tabBarLabel: isPhone ? shortLabels[route.name] : route.name,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Home")
            iconName = focused ? "grid" : "grid-outline";
          else if (route.name === "Tasks")
            iconName = focused ? "list-sharp" : "list-outline";
          else if (route.name === "Add Task")
            iconName = focused ? "add-circle" : "add-circle-outline";
          else if (route.name === "Completed")
            iconName = focused
              ? "checkmark-done-circle"
              : "checkmark-done-circle-outline";
          else if (route.name === "Notes")
            iconName = focused ? "star" : "star-outline";
          else if (route.name === "Users")
            iconName = focused ? "people" : "people-outline";
          else if (route.name === "Profile")
            iconName = focused ? "person" : "person-outline";
          return (
            <View
              style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}
            >
              <Ionicons
                name={iconName}
                size={isPhone ? 19 : 23}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            tasks={
              isAdmin
                ? tasks
                : tasks.filter((t) => t.owner === currentUser.email)
            }
            currentUser={currentUser}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Tasks">
        {({ navigation }) => (
          <TasksScreen
            tasks={tasks}
            taskActions={taskActions}
            currentUser={currentUser}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Add Task">
        {({ navigation }) => (
          <AddTaskScreen
            taskActions={taskActions}
            navigation={navigation}
            currentUser={currentUser}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Completed">
        {({ navigation }) => (
          <CompletedScreen
            tasks={tasks}
            taskActions={taskActions}
            currentUser={currentUser}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Notes">
        {({ navigation }) => (
          <NotesScreen
            notes={notes}
            noteActions={noteActions}
            currentUser={currentUser}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
      {isAdmin && (
        <Tab.Screen name="Users">
          {({ navigation }) => (
            <AdminUsersScreen
              users={users}
              userActions={userActions}
              tasks={tasks}
              currentUser={currentUser}
              navigation={navigation}
            />
          )}
        </Tab.Screen>
      )}
      <Tab.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen
            currentUser={currentUser}
            userActions={userActions}
            onLogout={onLogout}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ===============================================
// ROOT APP — handles auth session + persistence
// ===============================================
// Maps each screen to a real URL path so the browser's own back,
// forward, and reload buttons work naturally with in-app navigation
// (web only — this has no effect on native iOS/Android).
const linking = {
  prefixes: [],
  config: {
    screens: {
      // Auth screens (shown when logged out)
      Login: "",
      Signup: "signup",
      // App screens (shown when logged in)
      Home: "",
      Tasks: "tasks",
      "Add Task": "add-task",
      Completed: "completed",
      Notes: "notes",
      Users: "users",
      Profile: "profile",
    },
  },
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null); // raw Firebase Auth user
  const [currentUser, setCurrentUser] = useState(null); // merged profile (name/role/course/etc.)
  const [isReady, setIsReady] = useState(false);

  // Some Android phones "force dark mode" on websites that don't
  // declare a color scheme, inverting our light theme into a dark,
  // washed-out mess. This tells the browser explicitly: stay light.
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.style.colorScheme = "light";
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "color-scheme");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", "light");
    }
  }, []);

  // Watch Firebase Auth sign-in state. This is what makes login/logout/
  // signup "just work" without any manual navigation calls, and what
  // keeps a person logged in across reloads (session is handled by
  // Firebase itself, not by us).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCurrentUser(null);
        setIsReady(true);
      }
    });
    return unsubscribe;
  }, []);

  // Once we know who's signed in, listen live to their profile document
  // in Firestore (name, role, course, institute).
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setCurrentUser({ uid: firebaseUser.uid, ...snap.data() });
        }
        setIsReady(true);
      },
      (error) => {
        console.error(error);
        setIsReady(true);
      },
    );
    return unsubscribe;
  }, [firebaseUser]);

  // Live collections — every signed-in device sees the same data,
  // updated instantly, because these are Firestore real-time listeners
  // rather than local device storage.
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubTasks = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubNotes = onSnapshot(collection(db, "notes"), (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => {
      unsubTasks();
      unsubNotes();
      unsubUsers();
    };
  }, [firebaseUser]);

  const handleLogout = () => {
    signOut(auth).catch(console.error);
  };

  // --- Firestore CRUD helpers, passed down to screens ---
  const taskActions = {
    addTask: (data) => addDoc(collection(db, "tasks"), data),
    updateTask: (id, updates) => updateDoc(doc(db, "tasks", id), updates),
    deleteTask: (id) => deleteDoc(doc(db, "tasks", id)),
  };
  const noteActions = {
    addNote: (data) => addDoc(collection(db, "notes"), data),
    updateNote: (id, updates) => updateDoc(doc(db, "notes", id), updates),
    deleteNote: (id) => deleteDoc(doc(db, "notes", id)),
  };
  const userActions = {
    updateUser: (uid, updates) => updateDoc(doc(db, "users", uid), updates),
    // Client apps can only remove a user's profile document, not their
    // actual Firebase Auth login — fully deleting an account requires a
    // server-side Admin SDK, which is outside what this app can do.
    deleteUser: (uid) => deleteDoc(doc(db, "users", uid)),
  };

  if (!isReady) return null;

  return (
    <NavigationContainer linking={linking}>
      {currentUser ? (
        <AppTabs
          tasks={tasks}
          notes={notes}
          users={users}
          taskActions={taskActions}
          noteActions={noteActions}
          userActions={userActions}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

// ===============================================
// STYLES
// ===============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingHorizontal: 20,
    paddingTop: 50,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },

  gradientHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: THEME.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  gradientTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  gradientSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  gradientIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  screenHeader: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.textDark,
    marginBottom: 16,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.primaryDark,
    marginBottom: 8,
  },

  progressCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: { fontSize: 15, fontWeight: "700", color: THEME.textDark },
  progressSubLabel: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  progressValue: { fontSize: 22, fontWeight: "800", color: THEME.primary },
  trackBar: {
    height: 10,
    backgroundColor: THEME.primaryLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  fillBar: { height: "100%", backgroundColor: THEME.primary, borderRadius: 5 },

  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: THEME.surface,
    width: "31%",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.textDark,
    marginTop: 6,
  },
  metricTitle: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },

  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.textDark,
    marginBottom: 12,
  },
  taskListItem: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  tagGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  pPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pText: { fontSize: 10, fontWeight: "700" },
  cPill: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.textMuted,
    backgroundColor: THEME.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerPill: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.primaryDark,
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textDark,
    marginBottom: 4,
  },
  strikethrough: { textDecorationLine: "line-through", color: THEME.textMuted },
  itemDesc: { fontSize: 13, color: THEME.textMuted, marginBottom: 8 },
  itemDate: { fontSize: 12, color: THEME.textMuted, fontWeight: "600" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchField: { flex: 1, fontSize: 14, color: THEME.textDark, marginLeft: 8 },
  filterScroll: { flexDirection: "row", marginBottom: 16 },
  filterChip: {
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterChipText: { fontSize: 12, fontWeight: "600", color: THEME.textMuted },
  filterChipTextActive: { color: "#FFFFFF" },

  detailedCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  formContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 30,
    ...CARD_SHADOW,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: THEME.textDark,
    backgroundColor: THEME.background,
  },
  multilineInput: { height: 110, textAlignVertical: "top", lineHeight: 20 },
  noteContentInput: {
    height: 140,
    textAlignVertical: "top",
    lineHeight: 21,
    marginBottom: 4,
  },
  choiceGroup: { flexDirection: "row", gap: 8 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: THEME.background,
  },
  choiceBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  choiceText: { fontSize: 12, color: THEME.textMuted, fontWeight: "600" },
  choiceTextActive: { color: "#FFFFFF", fontWeight: "700" },

  webDateContainer: {
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: 10,
    padding: 6,
    backgroundColor: THEME.primaryLight,
  },
  webDatePickerInput: {
    width: "100%",
    padding: 6,
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: "bold",
    color: THEME.primaryDark,
    outline: "none",
    cursor: "pointer",
  },
  datePickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  datePickerText: { fontSize: 14, color: THEME.primaryDark, fontWeight: "700" },
  changeTag: { fontSize: 12, fontWeight: "700", color: THEME.primary },

  submitBtn: { borderRadius: 10, marginTop: 20, overflow: "hidden" },
  submitBtnGradient: { paddingVertical: 14, alignItems: "center" },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  emptyState: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textDark,
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: "center",
    marginTop: 4,
  },

  completedCardItem: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: THEME.success,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.success,
    marginTop: 6,
    marginBottom: 4,
  },
  deleteIconBtn: { padding: 8 },

  profileHeaderGradient: {
    alignItems: "center",
    paddingVertical: 28,
    borderRadius: 20,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: { color: "#FFFFFF", fontSize: 32, fontWeight: "800" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  profileRole: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  infoCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 30,
    ...CARD_SHADOW,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 12,
  },
  infoTextGroup: { flex: 1 },
  infoLabel: { fontSize: 11, color: THEME.textMuted },
  infoVal: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textDark,
    marginTop: 2,
  },
  editToggleBtn: {
    flexDirection: "row",
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  editToggleText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: THEME.dangerBg,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  logoutBtnText: { color: THEME.danger, fontWeight: "700", fontSize: 13 },

  // Admin user management
  userCard: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  userCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  userAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarSmallText: {
    color: THEME.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  userCardName: { fontSize: 14, fontWeight: "700", color: THEME.textDark },
  userCardEmail: { fontSize: 12, color: THEME.textMuted },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleTagText: { fontSize: 11, fontWeight: "700" },
  userCardMeta: { fontSize: 12, color: THEME.textMuted, marginBottom: 4 },

  tabBar: {
    height: 58,
    paddingBottom: 6,
    paddingTop: 6,
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  tabIconWrap: {
    width: 34,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: {
    backgroundColor: THEME.primaryLight,
  },

  // Auth screens
  authHero: {
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  authLogoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  authHeroTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  authHeroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  authFormCard: {
    backgroundColor: THEME.surface,
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 30,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  authFormTitle: { fontSize: 20, fontWeight: "800", color: THEME.textDark },
  authFormSubtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 4,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: THEME.background,
    gap: 8,
  },
  inputWithIconField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.textDark,
  },
  primaryBtn: { borderRadius: 12, marginTop: 22, overflow: "hidden" },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  demoBox: {
    backgroundColor: THEME.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
  },
  demoBoxTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: THEME.primaryDark,
    marginBottom: 4,
  },
  demoBoxText: { fontSize: 12, color: THEME.primaryDark },
  authFooterRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  authFooterText: { fontSize: 13, color: THEME.textMuted },
  authFooterLink: { fontSize: 13, color: THEME.primary, fontWeight: "800" },

  // Notes screen
  noteCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  noteCardImportant: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
    backgroundColor: "#FFFBF0",
  },
  noteCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textDark,
    flex: 1,
  },
  noteContent: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 8,
    lineHeight: 19,
  },
  importantToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: THEME.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  importantToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textDark,
  },

  // Pagination — compact on phone, roomier on tablet/desktop
  paginationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    ...CARD_SHADOW,
  },
  paginationBarCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  paginationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: THEME.primaryLight,
  },
  paginationBtnCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  paginationBtnDisabled: {
    backgroundColor: THEME.background,
  },
  paginationBtnText: { fontSize: 13, fontWeight: "700", color: THEME.primary },
  paginationBtnTextCompact: { fontSize: 11 },
  paginationBtnTextDisabled: { color: THEME.textMuted },
  paginationPageText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textDark,
  },
  paginationPageTextCompact: { fontSize: 11 },
});
