import "./App.css";
import "./index.css";
import Dashboard from "../src/Components/dashboard";
import SecureFileSystemLogin from "../src/Components/login";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseclient";
//import Chart from "../src/Components/chart";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Get the session (if any) after OAuth redirect
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const userId = session.user.id;
        localStorage.setItem("user_id", userId);
        console.log(session);
        localStorage.setItem(
          "avatar_url",
          session.user.user_metadata.avatar_url
        );
        localStorage.setItem("Name", session.user.user_metadata.full_name);
        setIsAuthenticated(true); // Set authenticated status
      } else {
        localStorage.removeItem("user_id");
        setIsAuthenticated(false); // Not authenticated
      }
      setLoading(false); // Finished checking session
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* If authenticated, show dashboard, else redirect to login */}
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Dashboard /> : <SecureFileSystemLogin />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
