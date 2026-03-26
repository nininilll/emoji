import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Smile, Upload, BookOpen, LogOut, User } from 'lucide-react'
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

  const [user, setUser] = useState(() => getToken() ? getUser() : null)

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <Smile className="w-7 h-7" />
              <span>表情包搬家助手</span>
            </Link>
            <div className="flex items-center gap-1">
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
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection/:id" element={<CollectionPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>

      {/* 底部 */}
      <footer className="text-center py-6 text-sm text-gray-400">
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

export default App

