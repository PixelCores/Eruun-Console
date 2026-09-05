# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库工作时提供指引。

## 项目简介

**Eruun Console** 是 [Eruun](../Eruun) 的 Web 控制台。Eruun 是面向 Agent、模型与 AI 工作负载的分布式运行时（Go 后端，API 默认端口 8000，路由前缀 `/api/v1`）。

代码库整体移植自参考项目 **KubeMin-Console**（`/Users/pixelkernel/PrivateProject/src/KubeMin/KubeMin-Console`），界面与其保持一致；品牌已全部重命名为 Eruun（`kubemin` → `eruun`，含 localStorage 前缀与 K8s label `ui.eruun.io/x|y`）。

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
- **Tailwind CSS 4** — 样式（`index.css` 的 `@theme` + `styles/themes.css` 的 CSS 变量；`tailwind.config.js` 为移植遗留的参考配置，实际生效的是 CSS-first 配置）
- **React Router 7** — 路由
- **Zustand 5** — 客户端状态
- **SWR** — 服务端数据获取与缓存
- **next-intl** — 国际化（`NextIntlClientProvider`，非 Next.js 用法）
- **@xyflow/react** — 工作流画布引擎
- **lucide-react** — 图标；**js-yaml**、**dagre** 辅助工作流编辑

## 路由结构

```
/login                    登录页（验证码/密码两种方式）
/ → /dashboard1           仪表盘（模型/推理/训练/语言/工具等区块）
/apps                     应用列表
/workflow/:appId          工作流画布（核心功能，组件⇄节点双向转换、Traits 面板族、GuidedTour）
/api-docs                 API 文档页
/button-popup-example     组件示例页
```

## 目录结构

```
src/
├── api/            # API 层：request.ts 为统一入口；paasAuth.ts 为认证服务客户端
├── assets/         # 图片与 svg 资源
├── components/     # 通用组件
│   ├── base/         # 基础控件（Modal/Input/Tooltip/Switch…）
│   ├── ui/           # Button 系组件与 PortalToFollowElem
│   ├── Layout/       # DashboardLayout / AuthenticatedShell
│   ├── workflow/     # 工作流面板族（Traits*/Env/Log/Tasks/APIDocs…）
│   ├── traits/       # Traits 管理器（容器/环境变量/探针/RBAC/存储）
│   ├── account/      # 账户弹窗
│   └── CommandPalette/
├── config/         # tourSteps（GuidedTour 步骤配置）
├── examples/
├── hooks/          # useShortcuts/useDebounce/useInfiniteScroll/useResizeWidth…
├── i18n/           # messages.ts（en + zh-CN）+ Provider
├── pages/          # dashboard/ apps/ login/ schedule/ WorkflowPage / ApiDocsPage…
├── stores/         # flowStore（画布）、authStore、settingsStore、tenantStore、
│                   # shortcutsStore、tourStore、uiStore
├── styles/         # themes.css 语义化设计令牌（亮/暗）
├── types/          # flow/app/model/tool/customer 类型
└── utils/          # cn、component⇄node 转换器、edge、keyboard、url、workflowHelper…
```

## 核心约定（必须遵守）

1. **包管理器只用 pnpm**。仓库中不应出现 npm/yarn 锁文件。
2. **业务 API 请求走 `src/api/request.ts`**。Eruun 响应格式为 `BaseResponse<T>`（`code === 0` 成功），request 统一拆包；baseURL 由 `settingsStore.apiBaseUrl`（可在设置页覆盖）回退到 `VITE_API_BASE_URL`。认证服务走 `src/api/paasAuth.ts`（`VITE_PAAS_AUTH_BASE_URL` / `VITE_PAAS_API_BASE_URL`）。
3. **localStorage 键统一 `eruun_` 前缀**（`eruun_settings`、`eruun_paas_session`、`eruun_shortcuts` 等）。新增键保持前缀一致。
4. **登录守卫由 `VITE_AUTH_ENABLED` 控制**（见 `src/App.tsx` 顶部 `AUTH_ENABLED`）：开发默认 `false`（后端认证接口未就绪时全部放行），生产 `true`。改动守卫逻辑只动 `RequireAuth` 一处。
5. **ESLint 门槛为 0 error**。`no-explicit-any`、`react-hooks/set-state-in-effect`、`react-refresh/only-export-components` 已降为 warning（移植历史债）；`no-unused-vars` 配置了下划线前缀与 rest 解构豁免。新代码不应新增 warning。
6. **i18n 双语文案同步维护**：`messages.ts` 中 `en` 与 `zh-CN` 键保持一致。
7. **画布节点位置持久化**在 K8s label `ui.eruun.io/x` / `ui.eruun.io/y`（见 `componentToNode.ts` / `nodeToComponent.ts`），改名会影响存量应用布局，不要动。

## 工作流画布架构

- 单一 Zustand store（`stores/flowStore.ts`）管理 nodes/edges/选中态/控制模式/剪贴板；所有变更先经 React Flow change handler 再入 store。
- **component ⇄ node 双向转换器**：`utils/componentToNode.ts`（后端组件 → 画布节点）、`utils/nodeToComponent.ts`（节点 → 提交给后端的组件配置）。
- Traits 面板分两层：通用管理器（`components/traits/`）与工作流内嵌面板（`components/workflow/Traits*`）。
- 快捷键见 `hooks/useShortcuts.ts` + `stores/shortcutsStore.ts`（可自定义，持久化到 `eruun_shortcuts`）。

## 样式约定

- 工具类令牌（`text-text-primary`、`bg-components-panel-bg`、`border-divider-regular` 等）由 `index.css` 的 `@theme` 定义；语义化变量（亮/暗两套）在 `styles/themes.css`。
- 新增颜色：优先复用现有令牌；确需新增时在 `index.css` 的 `@theme` 中定义。

## 后端参考

- 后端仓库：`/Users/pixelkernel/PrivateProject/src/Eruun`（Go + gin，DDD 分层在 `pkg/apiserver/`）。
- 本地开发：`/api` 由 Vite 代理到 `http://localhost:8000`；SSE 日志流端点（`/applications/*/components/*/logs`）使用无缓冲代理，改动 `vite.config.ts` 时保留该配置。
- 应用模型对齐后端 `pkg/apiserver/interfaces/api/dto/v1`。
