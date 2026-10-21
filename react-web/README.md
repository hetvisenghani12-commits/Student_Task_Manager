# StudyFlow — React (web) version

A React + Vite conversion of the Expo / React Native app in the parent folder.
It uses the same Firebase project, so accounts, tasks, notes and users are shared
between the mobile app and this website.

## Run it

```bash
cd react-web
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in react-web/dist
```

## What changed from React Native

| React Native / Expo                       | React (web)                                   |
| ----------------------------------------- | --------------------------------------------- |
| `View`, `Text`, `ScrollView`              | `div`, `span`, `h1`, normal page scrolling    |
| `TextInput`                               | `<input>` / `<textarea>`                      |
| `TouchableOpacity`                        | `<button>`                                    |
| `StyleSheet.create`                       | `src/styles.css` (CSS classes + variables)    |
| `expo-linear-gradient`                    | CSS `linear-gradient`                         |
| `@expo/vector-icons` (Ionicons)           | `react-icons/io5` (same Ionicons set)         |
| React Navigation (stack + bottom tabs)    | `react-router-dom` routes + `TabBar` component |
| `DateTimePicker`                          | `<input type="date">`                         |
| `Alert.alert`                             | `window.alert` / `window.confirm`             |
| `useWindowDimensions`                     | `useBreakpoint` hook using `window.innerWidth` |
| AsyncStorage auth persistence             | Firebase web auth (persists automatically)    |

## Structure

```
src/
  main.jsx            entry point (BrowserRouter)
  App.jsx             auth state, Firestore listeners, routes
  firebase.js         Firebase config
  theme.js            colors, constants, helpers
  styles.css          all styles
  components/         GradientHeader, Pagination, TabBar, TaskPills
  screens/            Login, Signup, Home, Tasks, AddTask, Completed,
                      Notes, AdminUsers, Profile
```

Routes: `/` (Login or Home), `/signup`, `/tasks`, `/add-task`, `/completed`,
`/notes`, `/users` (admins only), `/profile`.
