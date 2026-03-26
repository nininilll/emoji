import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Trash2, Image, Download, Share2, Clock } from 'lucide-react'
import { getCollections, createCollection, deleteCollection } from '../api'

export default function HomePage() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    try {
      const data = await getCollections()
      if (data.success) setCollections(data.collections)
    } catch (err) {
      console.error('加载合集失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      const data = await createCollection(newName.trim(), newDesc.trim())
      if (data.success) {
        navigate(`/collection/${data.collection.id}`)
      }
    } catch (err) {
      console.error('创建失败:', err)
    }
  }

  async function handleDelete(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('确定要删除这个合集吗？所有表情包都会被删除。')) return
    try {
      await deleteCollection(id)
      setCollections(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  return (
    <div>
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-3">表情包搬家助手 😎</h1>
        <p className="text-primary-100 text-lg mb-6">
          从微信、QQ、微博、抖音导出表情包，批量打包下载，一键分享给好友
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-white text-primary-600 px-5 py-2.5 rounded-xl font-medium hover:bg-primary-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建表情包合集
          </button>
          <Link
            to="/guide"
            className="flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-white/30 transition-colors"
          >
            📖 查看搬家教程
          </Link>
        </div>
      </div>

      {/* 创建合集弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">创建新合集</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">合集名称 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：沙雕猫猫表情包"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="简单描述一下这个合集..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 合集列表 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">我的合集</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            新建
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
            加载中...
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">还没有表情包合集</p>
            <p className="text-gray-400 text-sm mb-6">创建一个合集，开始上传你的表情包吧</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              创建第一个合集
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(collection => (
              <Link
                key={collection.id}
                to={`/collection/${collection.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-lg truncate flex-1">
                    {collection.name}
                  </h3>
                  <button
                    onClick={(e) => handleDelete(e, collection.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除合集"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {collection.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Image className="w-3.5 h-3.5" />
                    {collection.emojis?.length || 0} 个表情
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {collection.download_count || 0} 次下载
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(collection.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {/* 预览缩略图 */}
                {collection.emojis?.length > 0 && (
                  <div className="flex gap-1.5 mt-4 overflow-hidden">
                    {collection.emojis.slice(0, 5).map(emoji => (
                      <div key={emoji.id} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={emoji.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {collection.emojis.length > 5 && (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        +{collection.emojis.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

