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
  const [previewEmoji, setPreviewEmoji] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDownload, setConfirmDownload] = useState(false)

  // 通过 fetch+blob 方式下载文件（解决跨域 <a download> 不触发下载的问题）
  async function downloadFile(url, filename) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('下载失败:', err)
      // 降级：直接打开链接
      window.open(url, '_blank')
    }
  }

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
      setConfirmDelete(null)
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
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      // HTTP 环境降级方案
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('复制失败:', err)
        alert('复制失败，请手动复制链接')
      }
      document.body.removeChild(textArea)
    }
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
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
          <Link to="/" className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{collection.name}</h1>
            {collection.description && (
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{collection.description}</p>
            )}
          </div>
          {/* 桌面端操作按钮 */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>
            {collection.emojis.length > 0 && (
              <button
                onClick={() => setConfirmDownload(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                全部下载
              </button>
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
        {/* 移动端操作按钮 - 独立一行 */}
        <div className="flex sm:hidden items-center gap-2 mt-2 pl-9">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            分享
          </button>
          {collection.emojis.length > 0 && (
            <button
              onClick={() => setConfirmDownload(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载
            </button>
          )}
          <button
            onClick={handleDeleteCollection}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
            title="删除合集"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center cursor-pointer transition-all mb-4 sm:mb-6 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary-500 mx-auto mb-2 sm:mb-3" />
            <p className="text-primary-600 font-medium mb-2 text-sm sm:text-base">上传中... {uploadProgress}%</p>
            <div className="w-48 sm:w-64 mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 rounded-full h-2 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : isDragActive ? (
          <div>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 mx-auto mb-2 sm:mb-3" />
            <p className="text-primary-600 font-medium text-sm sm:text-base">松开鼠标上传表情包</p>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-gray-600 font-medium mb-1 text-sm sm:text-base">拖拽表情包到这里，或点击选择文件</p>
            <p className="text-gray-400 text-xs sm:text-sm">支持 GIF / PNG / JPG / WEBP，最大 10MB</p>
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

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
            {collection.emojis.map(emoji => (
              <div
                key={emoji.id}
                className={`relative group emoji-grid-item rounded-xl overflow-hidden bg-white border ${
                  selectedEmojis.has(emoji.id) ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100'
                }`}
                onClick={() => selectMode ? toggleSelect(emoji.id) : setPreviewEmoji(emoji)}
              >
                <div className="aspect-square p-2 flex items-center justify-center cursor-pointer">
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={e => { e.stopPropagation(); downloadFile(emoji.url, emoji.original_name || emoji.filename) }}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-green-50 text-gray-600 hover:text-green-500 transition-colors"
                      title="下载"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(emoji) }}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile(previewEmoji.url, previewEmoji.original_name || previewEmoji.filename)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button
                  onClick={() => { setConfirmDelete(previewEmoji); setPreviewEmoji(null) }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">确认删除</h3>
              <p className="text-sm text-gray-500">确定要删除这个表情包吗？此操作不可恢复。</p>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 flex items-center justify-center">
                <img src={confirmDelete.url} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下载确认弹窗 */}
      {confirmDownload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDownload(false)}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">下载全部表情包</h3>
              <p className="text-sm text-gray-500">
                将打包下载 {collection.emojis.length} 个表情包为 ZIP 压缩文件
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDownload(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <a
                href={getDownloadUrl(id)}
                onClick={() => setConfirmDownload(false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                确认下载
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 分享弹窗 */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">分享表情包合集</h2>
              <button onClick={() => setShowShare(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">分享链接</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mb-3">分享到社交平台：</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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

            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-amber-50 rounded-xl">
              <p className="text-xs sm:text-sm text-amber-700">
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
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl text-white ${color} hover:opacity-90 transition-opacity text-left`}
    >
      <span className="text-xl sm:text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-xs sm:text-sm">{name}</p>
        <p className="text-[10px] sm:text-xs opacity-80 hidden xs:block">{desc}</p>
      </div>
    </button>
  )
}

