import { NavLink } from 'react-router-dom';

export default function Navbar() {
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-textPrimary text-lg font-medium">Veritas</span>
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

        {/* Right section */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
            V
          </div>
        </div>

      </div>
    </div>
  );
}
