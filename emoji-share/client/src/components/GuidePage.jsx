import React, { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Smartphone, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'

const guides = [
  {
    id: 'wechat-export',
    platform: '微信',
    icon: '💬',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700',
    direction: 'export',
    title: '从微信导出表情包',
    steps: [
      {
        title: '方法一：逐个保存（推荐）',
        items: [
          '打开微信，进入任意聊天窗口',
          '点击表情图标，找到"我的收藏"表情',
          '长按要导出的表情包',
          '选择「保存到手机」或「发送给朋友」',
          '保存后在手机相册中可以找到',
          '将相册中的表情包批量上传到本工具'
        ]
      },
      {
        title: '方法二：通过文件传输助手',
        items: [
          '在微信中搜索「文件传输助手」',
          '把想要导出的表情逐个发送到文件传输助手',
          '在电脑端微信打开文件传输助手',
          '右键保存所有表情图片到电脑',
          '将保存的图片批量上传到本工具'
        ]
      },
      {
        title: '方法三：通过微信电脑端（批量）',
        items: [
          '打开微信电脑版（Windows/Mac）',
          '点击表情管理 → 我的收藏',
          '找到微信表情包存储目录：',
          'Windows: C:\\Users\\用户名\\Documents\\WeChat Files\\wxid_xxx\\FileStorage\\CustomEmotion',
          'Mac: ~/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/xxx/Emoji',
          '复制文件夹中的表情包文件',
          '注意：部分表情可能是加密格式，需要转换'
        ]
      }
    ]
  },
  {
    id: 'wechat-import',
    platform: '微信',
    icon: '💬',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-700',
    direction: 'import',
    title: '导入表情包到微信',
    steps: [
      {
        title: '方法一：手机端添加',
        items: [
          '先用本工具下载表情包到手机相册',
          '打开微信 → 我 → 表情 → 我的收藏',
          '点击右上角「+」号',
          '从相册中选择下载好的表情包图片',
          '逐个或批量添加到微信表情收藏'
        ]
      },
      {
        title: '方法二：聊天中添加',
        items: [
          '在任意聊天窗口中发送下载好的表情图片',
          '长按发送的图片',
          '选择「添加到表情」',
          '表情会自动添加到你的收藏中'
        ]
      }
    ]
  },
  {
    id: 'qq-export',
    platform: 'QQ',
    icon: '🐧',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    direction: 'export',
    title: '从QQ导出表情包',
    steps: [
      {
        title: '方法一：手机QQ逐个保存',
        items: [
          '打开QQ，进入任意聊天窗口',
          '点击表情图标，找到收藏的表情',
          '长按表情包',
          '选择「保存到手机」',
          '在手机相册中找到保存的表情',
          '批量上传到本工具'
        ]
      },
      {
        title: '方法二：电脑QQ批量导出',
        items: [
          '打开电脑版QQ',
          '找到QQ表情存储目录：',
          'Windows: C:\\Users\\用户名\\Documents\\Tencent Files\\QQ号\\Image\\Group2\\Emoji',
          '或者：C:\\Users\\用户名\\AppData\\Roaming\\Tencent\\QQ\\Temp\\QQ号\\Emoji',
          '复制目录中的表情包文件',
          '上传到本工具'
        ]
      }
    ]
  },
  {
    id: 'qq-import',
    platform: 'QQ',
    icon: '🐧',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    direction: 'import',
    title: '导入表情包到QQ',
    steps: [
      {
        title: '添加到QQ表情收藏',
        items: [
          '先用本工具下载表情包到手机相册',
          '打开QQ → 任意聊天窗口 → 表情面板',
          '点击右下角「+」或表情管理',
          '选择「从相册添加」',
          '批量选择下载好的表情图片',
          '确认添加到QQ表情收藏'
        ]
      }
    ]
  },
  {
    id: 'weibo-export',
    platform: '微博',
    icon: '📢',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-700',
    direction: 'export',
    title: '从微博导出表情包',
    steps: [
      {
        title: '保存微博表情',
        items: [
          '打开微博App或网页版',
          '找到包含表情包的微博帖子',
          '长按图片 → 保存到手机',
          '或在网页版右键另存为图片',
          '批量保存后上传到本工具'
        ]
      }
    ]
  },
  {
    id: 'weibo-import',
    platform: '微博',
    icon: '📢',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-700',
    direction: 'import',
    title: '导入表情包到微博',
    steps: [
      {
        title: '添加微博自定义表情',
        items: [
          '先用本工具下载表情包到手机相册',
          '打开微博 → 发布微博或评论',
          '点击表情图标 → 自定义表情',
          '点击「+」从相册添加表情',
          '选择下载好的表情图片添加'
        ]
      }
    ]
  },
  {
    id: 'douyin-export',
    platform: '抖音',
    icon: '🎵',
    color: 'bg-gray-800',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    direction: 'export',
    title: '从抖音导出表情包',
    steps: [
      {
        title: '保存抖音表情',
        items: [
          '打开抖音，找到包含表情包的评论或私信',
          '长按表情包图片',
          '选择「保存到相册」',
          '在手机相册中找到保存的表情',
          '批量上传到本工具'
        ]
      }
    ]
  },
  {
    id: 'douyin-import',
    platform: '抖音',
    icon: '🎵',
    color: 'bg-gray-800',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    direction: 'import',
    title: '导入表情包到抖音',
    steps: [
      {
        title: '添加抖音表情',
        items: [
          '先用本工具下载表情包到手机相册',
          '打开抖音 → 进入私信或评论',
          '点击表情图标 → 自定义表情',
          '点击「+」添加自定义表情',
          '从相册选择下载好的表情图片'
        ]
      }
    ]
  }
]

export default function GuidePage() {
  const [expandedGuide, setExpandedGuide] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterDirection, setFilterDirection] = useState('all')

  const platforms = ['all', '微信', 'QQ', '微博', '抖音']
  const directions = [
    { value: 'all', label: '全部' },
    { value: 'export', label: '导出教程' },
    { value: 'import', label: '导入教程' }
  ]

  const filteredGuides = guides.filter(g => {
    if (filterPlatform !== 'all' && g.platform !== filterPlatform) return false
    if (filterDirection !== 'all' && g.direction !== filterDirection) return false
    return true
  })

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">表情包搬家教程</h1>
        <p className="text-gray-500 text-xs sm:text-base">各平台表情包的导出和导入方法，按步骤操作即可完成搬家</p>
      </div>

      {/* 搬家流程概览 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">🚚 搬家流程</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0">
          <StepBadge num={1} text="从原平台导出表情包" color="bg-blue-500" />
          <Arrow />
          <StepBadge num={2} text="上传到本工具管理" color="bg-primary-500" />
          <Arrow />
          <StepBadge num={3} text="批量下载到手机/电脑" color="bg-green-500" />
          <Arrow />
          <StepBadge num={4} text="导入到目标平台" color="bg-purple-500" />
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">平台：</span>
          <div className="flex gap-1 flex-wrap">
            {platforms.map(p => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                  filterPlatform === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {p === 'all' ? '全部' : p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">类型：</span>
          <div className="flex gap-1 flex-wrap">
            {directions.map(d => (
              <button
                key={d.value}
                onClick={() => setFilterDirection(d.value)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                  filterDirection === d.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 教程列表 */}
      <div className="space-y-2 sm:space-y-3">
        {filteredGuides.map(guide => (
          <div
            key={guide.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden guide-card"
          >
            <button
              onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 text-left"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${guide.color} rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0`}>
                {guide.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{guide.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${guide.lightColor} ${guide.textColor}`}>
                    {guide.platform}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    guide.direction === 'export' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {guide.direction === 'export' ? '导出' : '导入'}
                  </span>
                </div>
              </div>
              {expandedGuide === guide.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedGuide === guide.id && (
              <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 border-t border-gray-50">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="mt-3 sm:mt-4">
                    <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      {step.title}
                    </h4>
                    <ol className="space-y-1.5 sm:space-y-2 ml-6 sm:ml-8">
                      {step.items.map((item, i) => (
                        <li key={i} className="flex gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                          <span className="text-primary-400 font-medium flex-shrink-0">{i + 1}.</span>
                          <span className={item.startsWith('Windows:') || item.startsWith('Mac:') || item.startsWith('或者：')
                            ? 'font-mono text-[10px] sm:text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all'
                            : ''
                          }>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">没有找到匹配的教程</p>
        </div>
      )}

      {/* 提示 */}
      <div className="mt-5 sm:mt-8 p-4 sm:p-5 bg-amber-50 rounded-2xl border border-amber-100">
        <h3 className="font-bold text-amber-800 mb-2 text-sm sm:text-base">⚠️ 注意事项</h3>
        <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-amber-700">
          <li>• 部分平台的表情包可能有加密或特殊格式，导出后可能需要格式转换</li>
          <li>• 微信的自定义表情包保存后可能是 GIF 或 PNG 格式</li>
          <li>• 建议使用电脑端操作，批量处理更方便</li>
          <li>• 各平台对表情包大小和格式有不同要求，导入时注意查看限制</li>
          <li>• 请尊重表情包原作者的版权，仅用于个人使用</li>
        </ul>
      </div>
    </div>
  )
}

function StepBadge({ num, text, color }) {
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-xl">
      <span className={`w-6 h-6 sm:w-7 sm:h-7 ${color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0`}>
        {num}
      </span>
      <span className="text-xs sm:text-sm font-medium text-gray-700">{text}</span>
    </div>
  )
}

function Arrow() {
  return (
    <span className="text-gray-300 text-xl mx-1 hidden sm:block">→</span>
  )
}

