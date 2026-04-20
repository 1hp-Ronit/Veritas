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

        {/* Right section */}
        <div className="flex items-center">
          {/* Empty Space / Profile goes here */}
        </div>

      </div>
    </div>
  );
}
