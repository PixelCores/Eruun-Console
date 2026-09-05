import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Eruun API server 默认端口 8000，路由前缀 /api/v1
const API_TARGET = 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // SSE 日志流端点 - 需要特殊处理以避免缓冲
      '^/api/v1/applications/.*/components/.*/logs': {
        target: API_TARGET,
        changeOrigin: true,
        // selfHandleResponse 关键配置 - 告诉代理由我们自行处理响应
        // 这样可以直接管道转发 SSE 流而不经过缓冲
        selfHandleResponse: true,
        configure: proxy => {
          proxy.on('proxyReq', proxyReq => {
            // 关键：SSE 禁用压缩 - gzip 会破坏流式传输
            proxyReq.setHeader('Accept-Encoding', 'identity')
          })
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            const contentType = proxyRes.headers['content-type'] || ''
            const statusCode = proxyRes.statusCode || 500

            // 后端返回 HTML（可能是错误页）或错误状态时，返回标准 SSE 错误
            if (contentType.includes('text/html') || statusCode >= 400) {
              res.writeHead(statusCode, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
              })
              res.write(`data: [Error] Backend returned status ${statusCode}\n\n`)
              res.end()
              return
            }

            res.writeHead(statusCode, {
              ...proxyRes.headers,
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no',
            })
            proxyRes.pipe(res)
          })
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Proxy] SSE proxy error:', err.message)
            if ('writeHead' in res && typeof res.writeHead === 'function') {
              res.writeHead(503, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              })
              res.write(`data: [Error] Backend unavailable: ${err.message}\n\n`)
              res.end()
            }
          })
        },
      },
      // 常规 API 端点
      '^/api/': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
