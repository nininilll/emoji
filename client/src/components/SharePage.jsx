import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Loader2, Image, Package, Smile, Check, X } from 'lucide-react'
import { getCollection, getDownloadUrl } from '../api'

export default function SharePage() {
  const { id } = useParams()
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingStates, setSavingStates] = useState({})
  const [previewEmoji, setPreviewEmoji] = useState(null)

  useEffect(() => {
    loadCollection()
  }, [id])

  async function loadCollection() {
    try {
      const data = await getCollection(id)
      if (data.success) {
        setCollection(data.collection)
      } else {
        setError('合集不存在或已被删除')
      }
    } catch (err) {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 单个表情包保存（通过长按提示）
  function handleSaveEmoji(emoji) {
    setSavingStates(prev => ({ ...prev, [emoji.id]: true }))
    // 创建一个临时链接进行下载
    const link = document.createElement('a')
    link.href = emoji.url
    link.download = emoji.original_name || emoji.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => {
      setSavingStates(prev => ({ ...prev, [emoji.id]: false }))
    }, 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-gray-500">加载表情包中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部信息 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium text-primary-200">表情包搬家助手</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{collection.name}</h1>
          {collection.description && (
            <p className="text-primary-100 text-sm sm:text-base mb-3 sm:mb-4">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-primary-200">
            <span className="flex items-center gap-1">
              <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {collection.emojis.length} 个表情包
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {collection.download_count || 0} 次下载
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 一键下载 */}
        {collection.emojis.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-bold text-gray-800 text-base sm:text-lg mb-1">一键批量下载</h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  下载全部 {collection.emojis.length} 个表情包（ZIP压缩包）
                </p>
              </div>
              <a
                href={getDownloadUrl(id)}
                className="flex items-center gap-2 bg-green-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <Package className="w-5 h-5" />
                下载全部表情包
              </a>
            </div>
          </div>
        )}

        {/* 使用提示 */}
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-blue-700">
            💡 <strong>手机用户：</strong>长按表情包图片可以直接保存到相册；
            也可以点击「下载全部」按钮打包下载。
          </p>
        </div>

        {/* 表情包网格 */}
        {collection.emojis.length > 0 ? (
          <div>
            <h2 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">全部表情包</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {collection.emojis.map(emoji => (
                <div
                  key={emoji.id}
                  className="relative bg-white rounded-xl border border-gray-100 overflow-hidden emoji-grid-item cursor-pointer"
                  onClick={() => setPreviewEmoji(emoji)}
                >
                  <div className="aspect-square p-2 flex items-center justify-center">
                    <img
                      src={emoji.url}
                      alt={emoji.original_name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  {/* 保存状态 */}
                  {savingStates[emoji.id] && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Check className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">已保存</span>
                      </div>
                    </div>
                  )}
                  {/* 点击提示 */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end justify-center opacity-0 hover:opacity-100">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-t-lg">
                      点击预览
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Image className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">这个合集还没有表情包</p>
          </div>
        )}

        {/* 导入指引 */}
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">📲 下载后如何导入？</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ImportGuide
              icon="💬"
              name="导入微信"
              steps={['保存表情到相册', '微信 → 我 → 表情', '点击右上角 + 号', '从相册选择添加']}
            />
            <ImportGuide
              icon="🐧"
              name="导入QQ"
              steps={['保存表情到相册', 'QQ聊天 → 表情面板', '点击 + 添加自定义表情', '从相册批量选择']}
            />
            <ImportGuide
              icon="📢"
              name="导入微博"
              steps={['保存表情到相册', '微博 → 发布/评论', '表情 → 自定义表情', '点击 + 从相册添加']}
            />
            <ImportGuide
              icon="🎵"
              name="导入抖音"
              steps={['保存表情到相册', '抖音 → 私信/评论', '表情 → 自定义表情', '点击 + 从相册添加']}
            />
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-400">
          <p>由「表情包搬家助手」生成的分享页面</p>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewEmoji && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewEmoji(null)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewEmoji(null)}
              className="absolute -top-2 -right-2 sm:top-0 sm:right-0 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center">
              <div className="flex-1 flex items-center justify-center mb-4 max-h-[60vh]">
                <img
                  src={previewEmoji.url}
                  alt={previewEmoji.original_name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-500 mb-3 truncate max-w-full">{previewEmoji.original_name}</p>
              <button
                onClick={() => { handleSaveEmoji(previewEmoji); setPreviewEmoji(null) }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                保存到手机
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ImportGuide({ icon, name, steps }) {
  return (
    <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-lg sm:text-xl">{icon}</span>
        <span className="font-medium text-gray-800 text-sm sm:text-base">{name}</span>
      </div>
      <ol className="space-y-1 sm:space-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-xs sm:text-sm text-gray-600">
            <span className="text-primary-400 font-medium">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

