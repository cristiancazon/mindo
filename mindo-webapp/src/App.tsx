import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TutorPage from './pages/TutorPage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={!user ? <LandingPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/tutor/:childId"
          element={user ? <TutorPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
