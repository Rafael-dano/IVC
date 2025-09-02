import './Navbar.css';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar bg-gray-900/95 text-white px-6 py-3 flex gap-3 justify-center shadow-md">
      <NavLink to="/" className="pill primary">TOOL</NavLink>
      <NavLink to="/ltd" className="pill primary">LTD</NavLink>
      <NavLink to="/help" className="pill primary">Help</NavLink>
      <NavLink to="/login" className="pill base">Login</NavLink>
      <NavLink to="/signup" className="pill primary">Sign Up</NavLink>
    </nav>
  );
}


  