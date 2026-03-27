import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Smile, Upload, BookOpen, LogOut, User, Menu, X } from 'lucide-react'
import HomePage from './components/HomePage'
import CollectionPage from './components/CollectionPage'
import GuidePage from './components/GuidePage'
import SharePage from './components/SharePage'
import AuthPage from './components/AuthPage'
import { getToken, getUser, logout as apiLogout } from './api'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSharePage = location.pathname.startsWith('/share/')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [user, setUser] = useState(() => getToken() ? getUser() : null)

  // 路由变化时关闭菜单
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // 分享页面不需要登录
  if (isSharePage) {
    return (
      <Routes>
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    )
  }

  // 未登录显示认证页面
  if (!user) {
    return <AuthPage onLogin={(u) => setUser(u)} />
  }

  function handleLogout() {
    apiLogout()
    setUser(null)
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary-600">
              <Smile className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="hidden xs:inline">表情包搬家助手</span>
              <span className="xs:hidden">搬家助手</span>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/" icon={<Upload className="w-4 h-4" />} label="我的合集" />
              <NavLink to="/guide" icon={<BookOpen className="w-4 h-4" />} label="搬家教程" />
              <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {user.nickname || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 移动端：用户头像 + 汉堡菜单 */}
            <div className="flex sm:hidden items-center gap-2">
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {user.nickname || user.username}
              </span>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white">
            <div className="px-3 py-2 space-y-1">
              <MobileNavLink to="/" icon={<Upload className="w-4 h-4" />} label="我的合集" />
              <MobileNavLink to="/guide" icon={<BookOpen className="w-4 h-4" />} label="搬家教程" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection/:id" element={<CollectionPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>

      {/* 底部 */}
      <footer className="text-center py-4 sm:py-6 text-xs sm:text-sm text-gray-400 px-4">
        表情包搬家助手 · 让表情包跨平台迁移更简单
      </footer>
    </div>
  )
}

function NavLink({ to, icon, label }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ to, icon, label }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export default App

