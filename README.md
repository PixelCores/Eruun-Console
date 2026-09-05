# Eruun Console

[Eruun](../Eruun) 的 Web 控制台 —— 面向 Agent、模型与 AI 工作负载的分布式运行时。

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173，/api 代理到 localhost:8000
```

其他命令：`pnpm build`（类型检查 + 构建）、`pnpm lint`、`pnpm format`、`pnpm preview`。

开发前先启动 Eruun API 服务（默认 `http://localhost:8000`）。

## 功能

- **仪表盘**：模型、推理服务、训练任务、编程语言、工具等区块总览
- **应用管理**：应用列表与生命周期操作
- **工作流画布**（`/workflow/:appId`）：组件⇄节点双向转换、Traits 面板族、GuidedTour、自定义快捷键、复制粘贴
- **API 文档**、**计划任务**、**命令面板**、**国际化**（中/英）

## 技术栈

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · React Router 7 · Zustand · SWR · next-intl · @xyflow/react

## 环境配置

| 文件               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| `.env`             | 基础配置（API 地址、应用信息、`VITE_AUTH_ENABLED`）          |
| `.env.development` | 开发环境（登录守卫默认关闭）                                 |
| `.env.production`  | 生产环境（登录守卫默认开启，`/api/v1` 走 nginx 同源反代）    |

部署相关文件：`Dockerfile`、`nginx.conf`、`Makefile`、`deployment.yaml`。

更多约定见 [CLAUDE.md](./CLAUDE.md)。
