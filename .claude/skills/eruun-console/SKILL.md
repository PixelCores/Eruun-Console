---
name: eruun-console
description: Collaboration standards for all Eruun Console frontend work — pages, components, styles, interactions, state management, API integration, and PRs. Use whenever the user asks to create, change, fix, design, or review any Web UI or frontend code in this repo, even for tiny style tweaks, single-file edits, or requests that do not mention this skill. Enforces Chinese communication with a standard footer, UI style consistency (font scale, design tokens), risk-based confirmation, clarify-first UI/UX design, 1:1 pixel replication, and the manual self-check that replaces automated tests.
---

# Eruun Console 前端协作规范

本规范约束本仓库所有前端工作的交付方式：如何沟通、改代码前如何评估风险、UI/UX 需求如何处理、完成后如何自检。技术栈与结构事实（路由、stores、命令、坑点）见 `CLAUDE.md`，这里不重复。

## 1. 与用户沟通

默认使用中文沟通。计划、解释、自检报告都用中文，不让用户在语言间切换。

每次回复结尾加上落款 `遵从 eruun-console 的规范回答。`——这是用户一眼确认本规范被执行的方式。

如果用户明确要求某个产物使用英文（UI 文案、commit message、PR 正文），该产物用英文；这是按产物例外，对话仍用中文。

## 2. ⚠️ UI 风格一致性（最高优先级，特别标注）

**整个项目必须保持一贯风格，任何 UI 改动都不得破坏既有视觉体系。** 改动任何页面/组件/样式前，先确认符合以下全部约定；拿不准就先问用户。

### 2.1 字号刻度（只允许这四档）

| 用途 | 刻度 |
|---|---|
| 页面级标题（h1） | `text-2xl font-semibold` |
| 分区/卡片标题（h2/h3） | `text-lg font-medium` 或 `font-semibold` |
| 正文、表单、按钮等一切控件 | `text-sm` |
| 辅助说明、标签、页脚 | `text-xs` |

**禁止新增任意值字号**（`text-[13px]` 等）。历史代码中约 340 处 `text-[10px]–[15px]` 是移植债务（集中在工作流画布与仪表盘组件），改动波及这些组件时可顺手归并到最近刻度，但不得主动扩散。

### 2.2 颜色与设计令牌

- 只允许使用设计令牌（`text-text-primary`、`bg-components-panel-bg`、`bg-state-accent-solid`、`border-divider-regular` 等），禁止为语义色引入硬编码十六进制值。
- 令牌由 `src/index.css` 的 `@theme`（含 `@theme inline` 映射）定义，亮/暗变量值在 `src/styles/themes.css`。新增颜色 = 先加 themes.css 变量（亮暗双份）+ 再加 `@theme` 映射；**不要**新建 `tailwind.config.js`。
- 新类名使用前必须验证 Tailwind 4 会生成它（v4 只编译 `@theme` 里声明的令牌；v3 写法如 `!class` 一律用 v4 的 `class!`）。

### 2.3 组件与交互

- 优先复用 `src/components/base/`（Modal/Input/Tooltip/Switch/ConfirmDialog…）与 `src/components/ui/`（Button 及其 variant/size 体系），不要平行造轮子。
- 交互模式跟随现状：hover/focus/disabled 态写法、圆角（`rounded-md/lg`）、阴影（`shadow-xs/sm/md`）、过渡（`transition-colors`）与现有组件对齐。
- 新增页面必须挂进既有骨架（`DashboardLayout`）与导航体系（Sidebar/CommandPalette/`?section=` 参数），并保持 `en` + `zh-CN` 双语文案同步。

### 2.4 自检补充项

UI 改动完成后，除第 6 节自检外，额外确认：字号未偏离四档刻度；颜色全部来自令牌；新类名已在编译产物中生成（可用 dev server 的编译 CSS 比对）。

## 3. 改代码前评估风险

本仓库没有测试套件，视觉与契约回归代价高，所以风险决定流程。改代码前简要说明：

- 实现的需求点
- 涉及的模块/文件/组件/函数/路由/状态
- 可能的副作用（兼容性、回归点、性能、可访问性）
- 实现策略（高层即可）

**低风险**（四条全部满足）：不改变用户可感知的行为/交互/视觉规范；不改变外部接口契约与关键数据流；不涉及复杂状态重构、并发竞态、安全边界、性能关键路径；范围局部、易于回滚。

**中/高风险**（任一即成立）：改变交互范式或视觉规范；改动路由结构、权限守卫、登录态策略、缓存、请求重试/取消、错误呈现规则；引入或替换基础设施（状态管理、请求层、组件库、构建配置、i18n 方案、埋点）；安全合规相关；性能关键路径。

- **低风险**：给出简要计划并当轮实现。信息不足但风险仍低时，在明确声明的假设下交付；只有假设可能影响正确性、安全性或公开行为时才追问。同一会话的多个低风险改动可合并交付。
- **中/高风险**：实现前必须获得用户明确确认。

## 4. UI/UX 任务：先澄清再设计

用户要求设计页面/组件/风格/视觉稿，或复刻设计时，不要直接产出成品。画板、栅格、品牌假设错了就是整页返工。先收敛需求，用户没提供的都要问：目标与范围（含空/加载/错误/禁用/无权限态）、平台与响应式范围、尺寸与栅格、视觉规范（品牌色、字体、圆角、阴影、暗色模式）、交互细节（hover/focus/active、动效时长曲线、键盘可达性）、参考与约束、交付物格式。

未澄清前，输出「方案选项 + 待确认问题 + 风险提示」，而非定稿设计。

## 5. 像素级复刻

用户提供截图/规格要求复刻时，尽可能 1:1：布局、尺寸、比例、圆角、阴影、间距、字号、行高、图标大小、组件密度。

- 用户指定的数值（px/rem、间距、字体、容器尺寸、对齐规则）为准；派生/近似值必须明确标注，不得以近似值冒充指定值。
- 关键尺寸缺失时先问用户；否则逐项标注哪些是派生值及取值范围与理由。
- 交付物可验证：附尺寸表、间距表、字号表、栅格/对齐基线，供用户对照验收。

## 6. 质量自检（本仓库无测试）

手工自检就是回归测试，跳过等于交付未验证代码。每次代码改动后执行并报告：

- **页面可访问**：改动触及的每个路由/页面在本地或目标环境能打开，关键交互路径可达（至少覆盖改动范围）。
- **无导入错误**：构建/启动无依赖解析错误、循环依赖、模块缺失。
- **无控制台错误**：浏览器 Console 无 error 级消息（运行时异常、资源加载失败、React 错误）。

建议流程：启动 dev server 访问涉及页面的关键状态（正常/空/错误/加载）；DevTools 查 Console 与 Network（失败请求、跨域、401/403）；涉及路由/守卫时实际跳转验证；影响构建时至少跑一次 `pnpm build` 确认产物。

## 7. 遵循项目约定

新增或修改的目录、文件、组件、hooks、状态、类型、常量、样式命名必须匹配仓库现有风格。无先例时：

- 组件：`PascalCase`；Hooks：`useXxx`；变量/函数：`camelCase`
- 常量：`UPPER_SNAKE_CASE`（仅真常量与枚举值）
- 类型：`PascalCase`，不使用 `I*` 前缀

其他硬性约定：包管理器只用 **pnpm**；业务请求统一走 `src/api/request.ts`（`BaseResponse<T>`，`code === 0` 成功）；localStorage 键统一 `eruun_` 前缀；登录守卫只改 `App.tsx` 的 `RequireAuth`；ESLint 门槛 **0 error**（`no-explicit-any` 等三条已降 warning，新代码不应新增 warning）。

## 8. 代码质量线

- 小组件、边界清晰、职责单一，不为抽象而抽象。
- 显式类型；避免无约束 `any`，确实需要时隔离并注释。
- 保持可访问性：语义化标签、键盘可达、可见焦点、足够对比度、必要的 aria 属性。
- 避免不必要重渲染；重视图用列表虚拟化、懒加载、代码分割；渲染路径上避免深 prop drilling 与重对象依赖。
- 用户输入要转义或白名单；富文本渲染需要明确的安全策略；外链与 URL 拼接要谨慎。
- 可复用的尺寸、间距、颜色、z-index、动画时长按项目令牌方式抽为常量，不散落魔法值。

实现完成后先清理再报告：删除重复代码与未用分支；减少嵌套与隐式副作用；统一错误处理与空/加载呈现；适用时复查响应式与暗色模式。

## 9. API 与契约同步

改动涉及 API 集成、mock 数据、埋点事件时，同一改动内同步所有相关产物：请求/响应类型定义、mock/夹具、埋点事件名与字段。若改动可能影响后端或数据分析定义，按中/高风险处理，先与用户确认。

## 10. PR 标题与正文

- 标题：清晰、祈使句、概括核心改动
- 正文（按需）：Summary / Changes / Self-check / Notes
- PR 正文使用真实换行，禁止 `\n` 字面转义
- 后续提交改变 PR 范围或行为时，同步更新标题/正文（限用户可见行为、接口集成、自检标准与风险说明受影响时）

---

## 交付清单（每次改动请求）

- [ ] 中文沟通，结尾落款 `遵从 eruun-console 的规范回答。`（用户指定英文的产物除外）
- [ ] **UI 风格一致：字号四档刻度、颜色全走令牌、复用既有组件（见第 2 节）**
- [ ] 已评估风险；中/高风险已获确认
- [ ] UI/UX 设计任务：先澄清需求再产出
- [ ] 复刻请求：按用户指定值 1:1；派生值已标注
- [ ] 自检完成并报告：页面可访问 / 无导入错误 / 无控制台错误
- [ ] 需要时给出 PR 标题/正文
