import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  ArrowLeft, Upload, Download, Share2, Trash2, Check, Copy,
  Image, X, Loader2, CheckCircle2, Package
} from 'lucide-react'
import {
  getCollection, uploadEmojis, deleteEmoji, deleteCollection,
  getShareInfo, getDownloadUrl
} from '../api'

export default function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedEmojis, setSelectedEmojis] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)

  useEffect(() => {
    loadCollection()
  }, [id])

  async function loadCollection() {
    try {
      const data = await getCollection(id)
      if (data.success) {
        setCollection(data.collection)
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const data = await uploadEmojis(id, acceptedFiles, setUploadProgress)
      if (data.success) {
        await loadCollection()
      }
    } catch (err) {
      console.error('上传失败:', err)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/gif': ['.gif'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading
  })

  async function handleDelete(emojiId) {
    try {
      await deleteEmoji(id, emojiId)
      setCollection(prev => ({
        ...prev,
        emojis: prev.emojis.filter(e => e.id !== emojiId)
      }))
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  async function handleBatchDelete() {
    if (selectedEmojis.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedEmojis.size} 个表情包吗？`)) return
    for (const emojiId of selectedEmojis) {
      await deleteEmoji(id, emojiId)
    }
    setCollection(prev => ({
      ...prev,
      emojis: prev.emojis.filter(e => !selectedEmojis.has(e.id))
    }))
    setSelectedEmojis(new Set())
    setSelectMode(false)
  }

  async function handleDeleteCollection() {
    if (!confirm('确定要删除整个合集吗？所有表情包都会被删除。')) return
    try {
      await deleteCollection(id)
      navigate('/')
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  async function handleShare() {
    try {
      const data = await getShareInfo(id)
      if (data.success) {
        setShareUrl(data.shareUrl)
        setShowShare(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function toggleSelect(emojiId) {
    setSelectedEmojis(prev => {
      const next = new Set(prev)
      if (next.has(emojiId)) {
        next.delete(emojiId)
      } else {
        next.add(emojiId)
      }
      return next
    })
  }

  function selectAll() {
    if (selectedEmojis.size === collection.emojis.length) {
      setSelectedEmojis(new Set())
    } else {
      setSelectedEmojis(new Set(collection.emojis.map(e => e.id)))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!collection) return null

  return (
    <div>
      {/* 顶部 */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{collection.name}</h1>
          {collection.description && (
            <p className="text-gray-500 text-sm mt-0.5">{collection.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
          {collection.emojis.length > 0 && (
            <a
              href={getDownloadUrl(id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              全部下载
            </a>
          )}
          <button
            onClick={handleDeleteCollection}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="删除合集"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-3" />
            <p className="text-primary-600 font-medium mb-2">上传中... {uploadProgress}%</p>
            <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 rounded-full h-2 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : isDragActive ? (
          <div>
            <Upload className="w-10 h-10 text-primary-500 mx-auto mb-3" />
            <p className="text-primary-600 font-medium">松开鼠标上传表情包</p>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">拖拽表情包到这里，或点击选择文件</p>
            <p className="text-gray-400 text-sm">支持 GIF / PNG / JPG / WEBP，最大 10MB，可批量上传</p>
          </div>
        )}
      </div>

      {/* 表情包列表 */}
      {collection.emojis.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">
                表情包 ({collection.emojis.length})
              </h2>
              <button
                onClick={() => {
                  setSelectMode(!selectMode)
                  setSelectedEmojis(new Set())
                }}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                  selectMode
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {selectMode ? '取消选择' : '批量管理'}
              </button>
            </div>
            {selectMode && (
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-sm text-primary-600 hover:text-primary-700">
                  {selectedEmojis.size === collection.emojis.length ? '取消全选' : '全选'}
                </button>
                {selectedEmojis.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-3 py-1 bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除 ({selectedEmojis.size})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {collection.emojis.map(emoji => (
              <div
                key={emoji.id}
                className={`relative group emoji-grid-item rounded-xl overflow-hidden bg-white border ${
                  selectedEmojis.has(emoji.id) ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100'
                }`}
                onClick={() => selectMode && toggleSelect(emoji.id)}
              >
                <div className="aspect-square p-2 flex items-center justify-center">
                  <img
                    src={emoji.url}
                    alt={emoji.original_name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
                {/* 选择模式复选框 */}
                {selectMode && (
                  <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                    selectedEmojis.has(emoji.id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/80 border border-gray-300'
                  }`}>
                    {selectedEmojis.has(emoji.id) && <Check className="w-3 h-3" />}
                  </div>
                )}
                {/* 操作按钮 */}
                {!selectMode && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDelete(emoji.id)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {collection.emojis.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Image className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-1">合集里还没有表情包</p>
          <p className="text-gray-400 text-sm">上传一些表情包开始吧！</p>
        </div>
      )}

      {/* 分享弹窗 */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">分享表情包合集</h2>
              <button onClick={() => setShowShare(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500 mb-2">分享链接</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-3">分享到社交平台：</p>
            <div className="grid grid-cols-2 gap-3">
              <ShareButton
                name="微信"
                color="bg-green-500"
                icon="💬"
                desc="复制链接后发送给微信好友"
                onClick={() => { handleCopy(); alert('链接已复制，请打开微信粘贴发送给好友') }}
              />
              <ShareButton
                name="QQ"
                color="bg-blue-500"
                icon="🐧"
                desc="复制链接后发送给QQ好友"
                onClick={() => { handleCopy(); alert('链接已复制，请打开QQ粘贴发送给好友') }}
              />
              <ShareButton
                name="微博"
                color="bg-red-500"
                icon="📢"
                desc="分享到微博动态"
                onClick={() => {
                  window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`分享一组表情包：${collection.name}`)}`, '_blank')
                }}
              />
              <ShareButton
                name="抖音"
                color="bg-gray-800"
                icon="🎵"
                desc="复制链接后在抖音分享"
                onClick={() => { handleCopy(); alert('链接已复制，请打开抖音粘贴分享') }}
              />
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-700">
                💡 收到链接的好友可以在浏览器中打开，预览所有表情包并一键批量下载到手机相册，然后导入到任意平台使用。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ShareButton({ name, color, icon, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl text-white ${color} hover:opacity-90 transition-opacity text-left`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs opacity-80">{desc}</p>
      </div>
    </button>
  )
}

