# Eruun Console

[Eruun](../Eruun) 的 Web 控制台 —— 面向 Agent、模型与 AI 工作负载的分布式运行时。

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173，/api 代理到 localhost:8000
```

其他命令：`pnpm build`（类型检查 + 构建）、`pnpm lint`、`pnpm format`、`pnpm preview`。

## 技术栈

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · React Router 7 · Zustand · SWR · next-intl · @xyflow/react

## 环境配置

| 文件               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| `.env`             | 基础配置（API 地址、应用信息、`VITE_AUTH_ENABLED`）          |
| `.env.development` | 开发环境（登录守卫默认关闭）                                 |
| `.env.production`  | 生产环境（登录守卫默认开启，`/api/v1` 走 nginx 同源反代）    |

开发前先启动 Eruun API 服务（默认 `http://localhost:8000`）。

更多约定见 [CLAUDE.md](./CLAUDE.md)。
