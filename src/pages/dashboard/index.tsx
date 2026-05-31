import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

export default function Dashboard() {
  const location = useLocation()
  const isOnVideo = location.pathname.startsWith('/dashboard/video/')

  const navItems = [
    { to: '/dashboard/library', label: 'Library', icon: '📚', active: isOnVideo || location.pathname.startsWith('/dashboard/library') },
    { to: '/dashboard/chat', label: 'Chat', icon: '💬', active: location.pathname.startsWith('/dashboard/chat') },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar nav */}
      <nav className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs">C</div>
            <span className="font-semibold text-gray-800">CastAI</span>
          </div>
        </div>

        <div className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-gray-500">Account</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex items-stretch safe-area-pb">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                item.active ? 'text-purple-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-[10px] text-gray-400">Account</span>
        </div>
      </nav>
    </div>
  )
}
