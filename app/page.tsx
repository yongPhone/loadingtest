'use client'

import { useEffect, useRef, useState } from 'react'

interface LoadResult {
  url: string
  urlWithCacheBuster?: string // 用于展示的带缓存破坏参数的URL
  downloadTime: number
  renderTime: number
  totalTime: number
  success: boolean
  error?: string
  type: 'image' | 'html'
}

type Lang = 'zh' | 'en'

const DEFAULT_WIDTH = 393
const DEFAULT_HEIGHT = 630
const clampSize = (value: number, min = 50, max = 2000) =>
  Math.min(max, Math.max(min, value || min))

const i18n: Record<Lang, {
  title: string
  subtitle: string
  urlsLabel: string
  cacheNotice: string
  placeholder: string
  sizeLabel: string
  startBtn: string
  testingBtn: string
  clearBtn: string
  loadingText: string
  statsTitle: string
  resultsTitle: string
  resultTypeImage: string
  resultTypeHtml: string
  statSuccess: string
  statTotalDownload: string
  statTotalRender: string
  statTotal: string
  statAvgDownload: string
  statAvgRender: string
  statAvgTotal: string
  statMaxDownload: string
  statMaxRender: string
  statMaxTotal: string
  countUnit: string
  timeUnit: string
  statLabelDownload: string
  statLabelRender: string
  statLabelTotal: string
  concurrencyLabel: string
  backTop: string
  sizeTip: string
}> = {
  zh: {
    title: 'Loading Test',
    subtitle: '批量链接渲染性能测试工具',
    urlsLabel: '输入链接（每行一个，自动识别类型）：',
    cacheNotice: '自动禁用缓存，保证真实性能',
    placeholder:
      'https://example.com/image1.jpg\nhttps://example.com/image2.png\nhttps://example.com/page.html',
    sizeLabel: '渲染尺寸：',
    concurrencyLabel: '并发数量：',
    backTop: '回到顶部',
    sizeTip: '预览按输入宽高等比缩放',
    startBtn: '开始测试',
    testingBtn: '测试中...',
    clearBtn: '清空',
    loadingText: '正在批量测试，请稍候…',
    statsTitle: '汇总指标',
    resultsTitle: '详细结果',
    resultTypeImage: '图片',
    resultTypeHtml: 'HTML',
    statSuccess: '成功数量',
    statTotalDownload: '总下载时间',
    statTotalRender: '总渲染时间',
    statTotal: '总耗时',
    statAvgDownload: '平均下载时间',
    statAvgRender: '平均渲染时间',
    statAvgTotal: '平均总耗时',
    statMaxDownload: '最大下载时间',
    statMaxRender: '最大渲染时间',
    statMaxTotal: '最大总耗时',
    countUnit: '个',
    timeUnit: 'ms',
    statLabelDownload: '下载',
    statLabelRender: '渲染',
    statLabelTotal: '总计',
  },
  en: {
    title: 'Loading Test',
    subtitle: 'Batch link rendering performance tester',
    urlsLabel: 'Enter URLs (one per line, auto-detect type):',
    cacheNotice: 'Cache disabled to ensure real performance',
    placeholder:
      'https://example.com/image1.jpg\nhttps://example.com/image2.png\nhttps://example.com/page.html',
    sizeLabel: 'Render size:',
    concurrencyLabel: 'Concurrency:',
    backTop: 'Back to top',
    sizeTip: 'Preview scales proportionally to the input size',
    startBtn: 'Start',
    testingBtn: 'Testing...',
    clearBtn: 'Clear',
    loadingText: 'Batch testing, please wait…',
    statsTitle: 'Overview',
    resultsTitle: 'Detailed Results',
    resultTypeImage: 'Image',
    resultTypeHtml: 'HTML',
    statSuccess: 'Success Count',
    statTotalDownload: 'Total Download',
    statTotalRender: 'Total Render',
    statTotal: 'Total Time',
    statAvgDownload: 'Avg Download',
    statAvgRender: 'Avg Render',
    statAvgTotal: 'Avg Total',
    statMaxDownload: 'Max Download',
    statMaxRender: 'Max Render',
    statMaxTotal: 'Max Total',
    countUnit: 'items',
    timeUnit: 'ms',
    statLabelDownload: 'Download',
    statLabelRender: 'Render',
    statLabelTotal: 'Total',
  },
}

export default function Home() {
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<LoadResult[]>([])
  const [frameWidthInput, setFrameWidthInput] = useState(String(DEFAULT_WIDTH))
  const [frameHeightInput, setFrameHeightInput] = useState(String(DEFAULT_HEIGHT))
  const [lang, setLang] = useState<Lang>('en')
  const [langOpen, setLangOpen] = useState(false)
  const [concurrency, setConcurrency] = useState(4)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const langSwitchRef = useRef<HTMLDivElement | null>(null)
  const langToggleRef = useRef<HTMLButtonElement | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [progressCount, setProgressCount] = useState(0)
  const [showBackTop, setShowBackTop] = useState(false)
  const [langMenuPos, setLangMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const scrollLockRef = useRef(0)

  // 确保页面可滚动：组件挂载/卸载时清理可能残留的 body 样式
  useEffect(() => {
    const body = document.body
    const reset = () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
    }
    reset()
    return reset
  }, [])

  // 监听滚动显示“回到顶部”
  useEffect(() => {
    const onScroll = () => {
      setShowBackTop(window.scrollY > 260)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleBackTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 点击外部关闭语言选择
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langSwitchRef.current && !langSwitchRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // 打开时计算下拉位置，并在滚动/缩放时跟随
  useEffect(() => {
    if (!langOpen) return
    const updatePos = () => {
      const target = langToggleRef.current || langSwitchRef.current
      if (!target) return
      const rect = target.getBoundingClientRect()
      setLangMenuPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, { passive: true })
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos)
      window.removeEventListener('resize', updatePos)
    }
  }, [langOpen])

  const t = i18n[lang]

  // 自动识别URL类型
  const detectUrlType = (url: string): 'image' | 'html' => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico']
    const imageServices = ['picsum.photos', 'unsplash.com/photos', 'images.unsplash.com', 'via.placeholder.com', 'placehold.co', 'dummyimage.com']
    const urlLower = url.toLowerCase()
    
    // 检查文件扩展名
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      return 'image'
    }
    
    // 检查已知的图片服务
    if (imageServices.some(service => urlLower.includes(service))) {
      return 'image'
    }
    
    return 'html'
  }

  const runWithLimit = async <T, R>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>
  ): Promise<R[]> => {
    const results = new Array<R>(items.length)
    let nextIndex = 0

    const run = async () => {
      while (true) {
        const current = nextIndex++
        if (current >= items.length) return
        results[current] = await worker(items[current], current)
      }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, run)
    await Promise.all(workers)
    return results
  }

  const handleTest = async () => {
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urlList.length === 0) {
      alert('请至少输入一个链接')
      return
    }

    setLoading(true)
    setProgressCount(0)
    setTotalCount(urlList.length)
    const limit = Math.max(1, Math.min(concurrency || 1, 50))

    // 预置占位，立即展示测试进度
    const initialResults: LoadResult[] = urlList.map(url => ({
      url,
      urlWithCacheBuster: undefined,
      downloadTime: 0,
      renderTime: 0,
      totalTime: 0,
      success: false,
      error: lang === 'zh' ? '测试中...' : 'Testing...',
      type: detectUrlType(url),
    }))
    const currentResults = [...initialResults]
    setResults(initialResults)

    await runWithLimit(urlList, limit, async (url, index) => {
      const urlType = detectUrlType(url)
      try {
        const result = await testUrl(url, urlType)
        currentResults[index] = result
      } catch (error) {
        currentResults[index] = {
          url,
          urlWithCacheBuster: undefined,
          downloadTime: 0,
          renderTime: 0,
          totalTime: 0,
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          type: urlType,
        }
      }
      // 实时刷新展示进度
      setResults([...currentResults])
      setProgressCount(prev => prev + 1)
    })

    setLoading(false)
  }

  // 添加缓存破坏参数到URL
  const addCacheBuster = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `${url}${separator}_cacheBuster=${timestamp}_${random}`
  }

  const testUrl = async (
    url: string,
    mode: 'image' | 'html'
  ): Promise<LoadResult> => {
    const startTime = performance.now()
    // 添加缓存破坏参数，确保每次都是新请求
    const urlWithCacheBuster = addCacheBuster(url)

    return new Promise((resolve, reject) => {
      if (mode === 'image') {
        const img = new Image()
        let downloadEndTime = 0

        img.onload = () => {
          downloadEndTime = performance.now()
          const downloadTime = downloadEndTime - startTime

          // 使用 requestAnimationFrame 来确保渲染完成
          requestAnimationFrame(() => {
            const renderEndTime = performance.now()
            const renderTime = renderEndTime - downloadEndTime
            const totalTime = renderEndTime - startTime

            resolve({
              url,
              urlWithCacheBuster,
              downloadTime,
              renderTime,
              totalTime,
              success: true,
              type: 'image',
            })
          })
        }

        img.onerror = () => {
          reject(new Error('图片加载失败'))
        }

        // 使用带缓存破坏参数的URL
        img.src = urlWithCacheBuster
      } else {
        // HTML 渲染模式：优先 fetch + srcdoc 渲染，保证下载/渲染时间精确
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.left = '-9999px'
        iframe.style.width = '1px'
        iframe.style.height = '1px'
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')

        let cleaned = false
        const cleanup = () => {
          if (cleaned) return
          cleaned = true
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }

        const fallbackIframeLoad = () => {
          iframe.onload = () => {
            const downloadEndTime = performance.now()
            const downloadTime = downloadEndTime - startTime
            requestAnimationFrame(() => {
              const renderEndTime = performance.now()
              const renderTime = renderEndTime - downloadEndTime
              const totalTime = renderEndTime - startTime
              cleanup()
              resolve({
                url,
                urlWithCacheBuster,
                downloadTime,
                renderTime,
                totalTime,
                success: true,
                type: 'html',
              })
            })
          }

          iframe.onerror = () => {
            cleanup()
            reject(new Error('HTML 加载失败'))
          }

          document.body.appendChild(iframe)
          iframe.src = urlWithCacheBuster
        }

        ;(async () => {
          try {
            const fetchStart = performance.now()
            const res = await fetch(urlWithCacheBuster, { cache: 'no-store' })
            const text = await res.text()
            const downloadEndTime = performance.now()

            const blob = new Blob([text], { type: 'text/html' })
            const blobUrl = URL.createObjectURL(blob)

            iframe.onload = () => {
              const renderEndTime = performance.now()
              const downloadTime = downloadEndTime - fetchStart
              const renderTime = renderEndTime - downloadEndTime
              const totalTime = renderEndTime - startTime

              cleanup()
              URL.revokeObjectURL(blobUrl)

              resolve({
                url,
                urlWithCacheBuster,
                downloadTime,
                renderTime,
                totalTime,
                success: true,
                type: 'html',
              })
            }

            iframe.onerror = () => {
              URL.revokeObjectURL(blobUrl)
              cleanup()
              reject(new Error('HTML 渲染失败'))
            }

            document.body.appendChild(iframe)
            iframe.src = blobUrl
          } catch {
            // 跨域或 fetch 失败时回落到传统 iframe 方案
            fallbackIframeLoad()
          }
        })()
      }
    })
  }

  const handleClear = () => {
    setUrls('')
    setResults([])
  }

  const calculateStats = () => {
    if (results.length === 0) return null

    const successResults = results.filter(r => r.success)
    if (successResults.length === 0) return null

    const totalDownloadTime = successResults.reduce(
      (sum, r) => sum + r.downloadTime,
      0
    )
    const totalRenderTime = successResults.reduce(
      (sum, r) => sum + r.renderTime,
      0
    )
    const totalTime = successResults.reduce((sum, r) => sum + r.totalTime, 0)
    const maxDownloadTime = Math.max(...successResults.map(r => r.downloadTime))
    const maxRenderTime = Math.max(...successResults.map(r => r.renderTime))
    const maxTotalTime = Math.max(...successResults.map(r => r.totalTime))

    return {
      count: successResults.length,
      totalDownloadTime,
      totalRenderTime,
      totalTime,
      avgDownloadTime: totalDownloadTime / successResults.length,
      avgRenderTime: totalRenderTime / successResults.length,
      avgTotalTime: totalTime / successResults.length,
      maxDownloadTime,
      maxRenderTime,
      maxTotalTime,
    }
  }

  const stats = calculateStats()

  const widthNum = clampSize(
    frameWidthInput === '' ? DEFAULT_WIDTH : Number(frameWidthInput)
  )
  const heightNum = clampSize(
    frameHeightInput === '' ? DEFAULT_HEIGHT : Number(frameHeightInput)
  )

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo-mark">
            <span className="logo-mark-inner">LT</span>
          </div>
          <div className="brand-text">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div
          className="lang-switch"
          ref={langSwitchRef}
        >
          <button
            className={`lang-toggle ${langOpen ? 'open' : ''}`}
            ref={langToggleRef}
            type="button"
            onClick={() => {
              setLangOpen(prev => {
                const next = !prev
                if (next && (langToggleRef.current || langSwitchRef.current)) {
                  const target = langToggleRef.current || langSwitchRef.current
                  const rect = target!.getBoundingClientRect()
                  setLangMenuPos({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                  })
                }
                return next
              })
            }}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            {lang === 'zh' ? '中文' : 'English'}
          </button>
          {langOpen && (
            <div
              className="lang-menu"
              style={{
                position: 'fixed',
                zIndex: 40,
                top: langMenuPos.top,
                left: langMenuPos.left,
                width: langMenuPos.width ? `${langMenuPos.width}px` : undefined,
              }}
            >
              <button
                className={`lang-option ${lang === 'zh' ? 'active' : ''}`}
                onMouseDown={() => {
                  setLang('zh')
                  setLangOpen(false)
                }}
              >
                中文
              </button>
              <button
                className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                onMouseDown={() => {
                  setLang('en')
                  setLangOpen(false)
                }}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content">
        <div className="input-section">
          <label htmlFor="urls">
            {t.urlsLabel}
            <span className="cache-notice">{t.cacheNotice}</span>
          </label>
          <div className="input-wrapper">
            <div className="input-scroll">
              <div
                className="line-numbers"
                ref={lineNumbersRef}
              >
              {urls.split('\n').map((_, idx) => String(idx + 1)).join('\n') || '1'}
            </div>
            <textarea
              id="urls"
              value={urls}
              ref={textareaRef}
              onScroll={e => {
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
                }
              }}
              onChange={e => setUrls(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
              wrap="off"
            />
            </div>
          </div>
        </div>

        <div className="control-section">
          <div className="size-control">
            <div className="size-label-row">
              <label>{t.sizeLabel}</label>
            </div>
            <div className="size-inputs">
              <input
                type="number"
                value={frameWidthInput}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    setFrameWidthInput('')
                    return
                  }
                  const normalized = String(Number(raw))
                  setFrameWidthInput(normalized)
                }}
                disabled={loading}
                min="100"
                max="2000"
              />
              <span className="separator">×</span>
              <input
                type="number"
                value={frameHeightInput}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    setFrameHeightInput('')
                    return
                  }
                  const normalized = String(Number(raw))
                  setFrameHeightInput(normalized)
                }}
                disabled={loading}
                min="100"
                max="2000"
              />
              <span className="unit">px</span>
            </div>
            <div className="size-tip-icon" aria-label={t.sizeTip}>
              ?
              <div className="size-tip-bubble">
                {t.sizeTip}
              </div>
            </div>
          </div>

          <div className="size-control">
            <label>{t.concurrencyLabel}</label>
            <div className="size-inputs">
              <input
                type="number"
                value={concurrency}
                onChange={e => setConcurrency(Math.max(1, Number(e.target.value)))}
                disabled={loading}
                min="1"
                max="50"
              />
              <span className="unit">max</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTest}
            disabled={loading}
          >
            {loading ? t.testingBtn : t.startBtn}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={loading}
          >
            {t.clearBtn}
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-text">{t.loadingText}</div>
            <div className="progress">
              <div
                className="progress-bar"
                style={{
                  width: totalCount ? `${(progressCount / totalCount) * 100}%` : '0%',
                }}
              />
            </div>
            <div className="progress-info">
              {progressCount} / {totalCount}
            </div>
          </div>
        )}

        {stats && (
          <div className="stats-section">
            <h2>{t.statsTitle}</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{t.statSuccess}</h3>
                <div className="value">
                  {stats.count}
                  <span className="unit">{t.countUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statTotalDownload}</h3>
                <div className="value">
                  {stats.totalDownloadTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statTotalRender}</h3>
                <div className="value">
                  {stats.totalRenderTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statTotal}</h3>
                <div className="value">
                  {stats.totalTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statAvgDownload}</h3>
                <div className="value">
                  {stats.avgDownloadTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statAvgRender}</h3>
                <div className="value">
                  {stats.avgRenderTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statAvgTotal}</h3>
                <div className="value">
                  {stats.avgTotalTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statMaxDownload}</h3>
                <div className="value">
                  {stats.maxDownloadTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statMaxRender}</h3>
                <div className="value">
                  {stats.maxRenderTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>{t.statMaxTotal}</h3>
                <div className="value">
                  {stats.maxTotalTime.toFixed(2)}
                  <span className="unit">{t.timeUnit}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <h2>{t.resultsTitle}</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-card-header">
                    <div className="result-index">#{index + 1}</div>
                    <div className={`result-type-badge ${result.type}`}>
                      {result.type === 'image' ? t.resultTypeImage : t.resultTypeHtml}
                    </div>
                  </div>
                  
                  {result.success ? (
                    <>
                      <div className="result-preview-frame" style={{
                        width: '100%',
                        maxWidth: `${widthNum}px`,
                        aspectRatio: `${widthNum} / ${heightNum}`,
                        height: 'auto'
                      }}>
                        {result.type === 'image' ? (
                          <img 
                            src={result.urlWithCacheBuster || result.url} 
                              alt={`Preview ${index + 1}`}
                          />
                        ) : (
                          <iframe 
                            src={result.urlWithCacheBuster || result.url} 
                            title={`Preview ${index + 1}`}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        )}
                      </div>
                      
                      <div className="result-stats">
                        <div className="stat-row">
                          <span className="stat-label">{t.statLabelDownload}</span>
                          <span className="stat-value">{result.downloadTime.toFixed(2)} {t.timeUnit}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">{t.statLabelRender}</span>
                          <span className="stat-value">{result.renderTime.toFixed(2)} {t.timeUnit}</span>
                        </div>
                        <div className="stat-row total">
                          <span className="stat-label">{t.statLabelTotal}</span>
                          <span className="stat-value">{result.totalTime.toFixed(2)} {t.timeUnit}</span>
                        </div>
                      </div>
                      
                      <div className="result-url-footer" title={result.url}>
                        {result.url}
                      </div>
                    </>
                  ) : (
                    <div className="result-error">
                      <div className="error-icon">⚠️</div>
                      <div className="error-message">{result.error}</div>
                      <div className="result-url-footer" title={result.url}>
                        {result.url}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {showBackTop && (
          <button
            className="back-to-top"
            onClick={handleBackTop}
            aria-label={t.backTop}
          >
            {t.backTop}
          </button>
        )}
      </div>
    </div>
  )
}

