import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Loading Test - 批量链接渲染测试工具',
  description: '批量测试链接加载性能，支持图片和HTML渲染',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

