import { NavLink, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

const navItems = [
  { to: '/dashboard/library', label: 'Library', icon: '📚' },
  { to: '/dashboard/chat', label: 'Chat', icon: '💬' },
]

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar nav */}
      <nav className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
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
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
