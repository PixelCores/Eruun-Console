# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库工作时提供指引。

## 项目简介

**Eruun Console** 是 [Eruun](../Eruun) 的 Web 控制台。Eruun 是面向 Agent、模型与 AI 工作负载的分布式运行时（Go 后端，API 默认端口 8000，路由前缀 `/api/v1`）。

技术栈与目录约定对齐参考项目 **KubeMin-Console**（`/Users/pixelkernel/PrivateProject/src/KubeMin/KubeMin-Console`），从该项目移植组件时保持类名与分层不变。

## 命令

```bash
# 安装依赖（只使用 pnpm，禁止 npm/yarn）
pnpm install

# 开发服务器（默认 5173 端口，/api 代理到 localhost:8000）
pnpm dev

# 生产构建（tsc 类型检查 + vite 构建）
pnpm build

# Lint（门槛：0 error，warning 允许存在）
pnpm lint

# 格式化
pnpm format

# 预览生产构建
pnpm preview
```

## 技术栈

- **React 19 + TypeScript**（strict 模式）
- **Vite 7** — 构建与开发服务器
- **Tailwind CSS 4** — CSS-first 配置（无 tailwind.config.js，见下文「样式约定」）
- **React Router 7** — 路由
- **Zustand 5** — 客户端状态（persist 中间件持久化）
- **SWR** — 服务端数据获取与缓存
- **next-intl** — 国际化（`NextIntlClientProvider`，非 Next.js 用法）
- **@xyflow/react** — 工作流画布引擎（预装，画布功能移植自 KubeMin-Console）
- **lucide-react** — 图标

## 目录结构

```
src/
├── api/            # API 层：request.ts 为唯一请求入口，按资源分文件（apps.ts…）
├── components/     # 通用组件（Layout/ 为应用骨架）
├── config/         # 环境配置集中导出（import.meta.env 只在这里读取）
├── hooks/
├── i18n/           # messages.ts（en + zh-CN）+ Provider
├── pages/          # 路由页面，按域分目录
├── stores/         # Zustand stores
├── styles/         # themes.css 语义化设计令牌（亮/暗）
├── types/
└── utils/          # cn()、storage 等
```

## 核心约定（必须遵守）

1. **包管理器只用 pnpm**。提交产物不含 npm/yarn 锁文件。
2. **所有后端请求走 `src/api/request.ts`**。Eruun 响应格式为 `BaseResponse<T>`（`code === 0` 成功），request 已统一拆包并注入 `Authorization`；业务代码拿到的是 `data`。
3. **环境变量只在 `src/config/index.ts` 读取**，组件中不要直接访问 `import.meta.env`。
4. **localStorage 键统一 `eruun_` 前缀**，在 `src/utils/storage.ts` 的 `storageKeys` 登记后使用。
5. **登录守卫由 `VITE_AUTH_ENABLED` 控制**：开发默认 `false`（Eruun 后端认证接口未就绪），生产 `true`。认证契约（`/auth/login`、`token/expiresIn/user.role`）对齐参考实现，后端落地后可能调整——改动集中在 `src/api/paasAuth.ts` 与 `src/stores/authStore.ts`。
6. **ESLint 门槛为 0 error**。`no-explicit-any`、`react-hooks/set-state-in-effect`、`react-refresh/only-export-components` 三条规则已降为 warning（兼容移植代码）；新代码应尽量避免触发。
7. **i18n 双语文案同步维护**：`src/i18n/messages.ts` 中 `en` 与 `zh-CN` 的键必须保持一致，新增页面按功能域（PascalCase 命名空间）补充。
8. **SWR key 使用接口路径**（如 `/applications`），便于 `mutate` 按前缀失效。

## 样式约定

- Tailwind 4 采用 **CSS-first 配置**：`src/index.css` 中的 `@theme inline` 将工具类令牌映射到 `src/styles/themes.css` 的语义化 CSS 变量；暗色主题通过根元素 `.dark` 类切换变量值。
- 工具类命名与 KubeMin-Console 一致（`text-text-primary`、`bg-components-panel-bg`、`border-divider-regular`、`shadow-xs` 等），移植其组件时无需改类名。
- 不要新增 `tailwind.config.js`；扩展令牌时在 `themes.css` 加变量、在 `index.css` 的 `@theme` 加映射。

## 后端参考

- 后端仓库：`/Users/pixelkernel/PrivateProject/src/Eruun`（Go + gin）
- 本地开发：`/api` 由 Vite 代理到 `http://localhost:8000`；SSE 日志流端点（`/applications/*/components/*/logs`）有专门的无缓冲代理配置，改动 `vite.config.ts` 时注意保留。
- 应用模型对齐后端 `pkg/apiserver/interfaces/api/dto/v1`（见 `src/api/apps.ts`）。
