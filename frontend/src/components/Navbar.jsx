import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    navigate('/login');
  };

  // Get display name or email initial
  const displayName = isGuest ? 'Guest' : (user?.user_metadata?.full_name || user?.email || 'User');
  const initial = isGuest ? 'G' : (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const avatarUrl = isGuest ? null : user?.user_metadata?.avatar_url;

  return (
    <div className="flex flex-col w-full sticky top-0 z-50 bg-surface shadow-sm">
      {/* Top Colorful Accent Bar */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-brandBlue"></div>
        <div className="h-full flex-1 bg-brandRed"></div>
        <div className="h-full flex-1 bg-brandAmber"></div>
        <div className="h-full flex-1 bg-brandGreen"></div>
      </div>
      {/* Main Navbar */}
      <div className="h-16 flex items-center px-6 justify-between">
        
        {/* Left section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 pointer-events-none">
            <img src="/logo.png" alt="Veritas Logo" className="w-full h-full object-contain scale-[2.5]" />
          </div>
          <span className="text-textPrimary text-lg font-medium tracking-tight">Veritas</span>
          <span className="text-textSecondary text-sm hidden md:block">Intelligence</span>
        </div>

        {/* Center section (Tabs) */}
        <div className="flex items-center h-full gap-2">
          {[
            { path: '/', label: 'Case input' },
            { path: '/results', label: 'Results' },
            { path: '/graph', label: 'Evidence graph' }
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-textSecondary hover:bg-gray-100 hover:text-textPrimary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right section — User profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white">
                {initial}
              </div>
            )}
            <span className="text-textSecondary text-sm hidden lg:block max-w-[140px] truncate">
              {displayName}
            </span>
            <svg className="w-4 h-4 text-textMuted hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg border border-border/60 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-sm font-medium text-textPrimary truncate">{displayName}</p>
                <p className="text-xs text-textMuted truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
