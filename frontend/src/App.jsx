import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Beta from './pages/beta.jsx';
import LTD from './pages/LTD.jsx';
import Help from './pages/Help.jsx';
import FAQ from './pages/FAQ.jsx';
import QuickStart from "./pages/quick-start.jsx";
import LandingPage from "./pages/Landingpage.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Settings from "./pages/Settings.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/beta" element={<Beta />} />
        <Route path="/ltd" element={<LTD />} />
        <Route path="/help" element={<Help />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/quick-start" element={<QuickStart />} />
        <Route path="/landingPage" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/settings" element={<RequireAuth> <Settings /> </RequireAuth>} />
      </Routes>
    </Router>
  );
}

export default App;
