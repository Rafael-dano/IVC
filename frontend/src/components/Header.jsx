import { useState } from 'react';
import Navbar from './Navbar';

export default function Header({ darkMode, setDarkMode }) {
  return (
    <header className={`w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between bg-gray-800 text-white shadow-md`}>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 mb-2 sm:mb-0">
        <span className="text-3xl">♻️</span> IV <span className="text-cyan-400">Content</span>
      </h1>
      <div className="flex items-center gap-4">
        <Navbar />
      </div>
    </header>
  );
}
