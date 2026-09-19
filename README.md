# memo

一个本地优先(Local-first)的桌面信息管理工具,把 **照片库**、**待办清单** 和 **GitHub 仓库跟踪** 收进同一个窗口。

基于 Tauri 2 + React 19 + Vite 构建,所有数据以 JSON 形式保存在本机应用配置目录,不依赖任何后端服务。

![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-stable-000000?logo=rust&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows)

---

## 功能

### 📷 照片库

- 选择本地目录作为图库根目录,递归扫描 `jpg` / `jpeg` / `png` / `webp` / `gif` / `bmp`
- 按一级子目录自动分组成相册,根目录下的散图归入虚拟相册「未归类」
- 相册可编辑标题、描述、封面,支持收藏与隐藏,并按自定义顺序排列
- 读取 EXIF:相机/镜头型号、拍摄时间、光圈、快门、ISO、曝光补偿、焦距、闪光灯、白平衡、GPS 经纬度与海拔等
- 多种浏览方式:瀑布流网格、按日期分组网格,支持按名称 / 日期 / 大小排序
- 查看器内查看大图与完整 EXIF 信息面板

### ✅ 待办清单

- 四级优先级(none / low / medium / high)、截止日期、分类、多标签
- 多种视图:全部、今天、即将到期、已完成、按分类
- 多种排序:手动拖拽、按截止日期、按优先级、按创建时间
- 完成状态与完成时间自动记录

### ⭐ GitHub 仓库跟踪

- 通过 `owner/name` 添加仓库,由 Rust 侧请求 GitHub API 拉取元数据:描述、主页、语言、License、Topics、Star / Fork / Watch / Issues 数、最近推送时间、最新 Release
- 可选配置 Personal Access Token 提升 API 速率限额,并提供速率限额查询
- 仓库可分类、打标签、收藏,状态分为 `watching` / `evaluating` / `archived`
- 支持打开应用时自动同步,也可手动刷新单个仓库

### 📊 Dashboard

- 概览卡片、交互式面积图与数据表格(TanStack Table + Recharts)

### 其他

- 亮色 / 暗色 / 跟随系统主题
- 应用内点击的外链自动交由系统浏览器打开,不在应用内导航
- 开发模式内置 Debug 面板,可视化记录所有 Tauri `invoke` 调用与事件
- 主窗口在 WebView 加载完成后再显示,避免白屏闪烁

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 桌面容器 | Tauri 2(`tauri-plugin-log` / `opener` / `dialog`) |
| 前端框架 | React 19 + TypeScript 6 + Vite 8 |
| 路由 | React Router 7(`HashRouter`) |
| 样式 | Tailwind CSS 4 + shadcn/ui(`base-nova` 风格)+ lucide-react |
| 组件基座 | Base UI、Radix 系原语、dnd-kit(拖拽排序) |
| 图表 / 表格 | Recharts、TanStack Table |
| 表单校验 | Zod |
| Rust 后端 | `image`、`kamadak-exif`、`reqwest`、`chrono`、`serde` |
| 包管理器 | Bun(CI 使用 1.3.14) |

---

## 环境要求

- **Node.js** ≥ 20 或 **Bun** ≥ 1.3
- **Rust** stable 工具链
- **系统依赖**
  - Windows:MSVC 生成工具 + WebView2 Runtime(Win11 已内置)
  - Linux:`libwebkit2gtk-4.1-dev`、`libgtk-3-dev`、`libayatana-appindicator3-dev`、`librsvg2-dev`、`patchelf`
  - macOS:Xcode Command Line Tools

---

## 快速开始

```bash
# 安装依赖
bun install

# 仅启动前端(浏览器访问 http://localhost:3000)
bun run dev

# 启动完整桌面应用(自动拉起 Vite 并编译 Rust)
bun run tauri dev

# 打包发行版
bun run tauri build
```

### 可用脚本

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 启动 Vite 开发服务器(端口 3000,严格模式) |
| `bun run build` | `tsc -b` 类型检查后执行 Vite 生产构建,输出到 `dist/` |
| `bun run preview` | 预览生产构建产物 |
| `bun run lint` | ESLint 检查 |
| `bun run typecheck` | `tsc --noEmit` 类型检查 |
| `bun run format` | Prettier 格式化(含 Tailwind 类名排序) |
| `bun run tauri` | Tauri CLI 透传 |

---

## 项目结构

```
memo/
├─ .github/workflows/release.yml   # 打 tag 自动构建并发布
├─ src/                            # React 前端
│  ├─ app/dashboard/data.json      # Dashboard 示例数据
│  ├─ components/                  # 通用组件与 shadcn/ui 组件
│  ├─ features/                    # 领域模块(类型 + Context + UI)
│  │  ├─ albums/                   # 相册元数据与图库状态
│  │  ├─ photos/                   # 照片网格、查看器、EXIF 面板
│  │  ├─ repos/                    # 仓库表格、侧边栏、设置
│  │  └─ todos/                    # 待办列表与编辑器
│  ├─ hooks/                       # 通用 hooks
│  ├─ lib/                         # Tauri 调用封装(带 Debug 埋点)
│  ├─ pages/                       # 路由页面
│  ├─ App.tsx                      # 路由与 Provider 装配
│  └─ main.tsx                     # 入口(主题、Toaster、外链守卫)
└─ src-tauri/                      # Rust 后端
   ├─ capabilities/default.json    # 权限能力配置
   ├─ icons/                       # 应用图标
   ├─ src/lib.rs                   # 全部 Tauri 命令与插件注册
   ├─ src/main.rs                  # 二进制入口
   ├─ Cargo.toml
   └─ tauri.conf.json              # 窗口、构建、打包配置
```

---

## 架构说明

- **状态管理**:纯 React Context。`LibraryProvider`(照片库)、`TodosProvider`、`ReposProvider` 分别包裹应用,内部通过 `trackedInvoke` 读写 Rust 侧数据。
- **前后端通信**:前端统一走 `src/lib/tauri.ts` 的 `trackedInvoke` / `trackedEmit`,在开发模式下自动向 Debug 面板上报调用参数、耗时与结果。
- **数据落盘**:由 Rust 命令负责读写,统一存放在 Tauri 的 `app_config_dir`:

  | 文件 | 内容 |
  | --- | --- |
  | `albums.json` | 相册元数据 |
  | `todos.json` | 待办事项 |
  | `repos.json` | 跟踪的仓库 |
  | `repo-categories.json` | 仓库分类 |
  | `library.json` | 图库根目录 |
  | `settings.json` | GitHub Token、自动同步开关 |

  默认位置:
  - Windows:`%APPDATA%\com.hexia.memo\`
  - macOS:`~/Library/Application Support/com.hexia.memo/`
  - Linux:`~/.config/com.hexia.memo/`

- **图片加载**:扫描图库时,动态把根目录加入 Tauri asset protocol 作用域,前端通过 `asset:` 协议直接读取本地原图,无需拷贝文件。

> ⚠️ **安全提示**:GitHub Token 以明文形式保存在 `settings.json` 中,仅供本地个人使用。请勿把该文件提交到版本库或分享给他人。

### Tauri 命令一览

| 命令 | 作用 |
| --- | --- |
| `greet` | 示例命令(模板遗留) |
| `scan_library` | 递归扫描目录并按子目录分组为相册 |
| `read_exif` | 读取单张图片的 EXIF 信息 |
| `load_album_meta` / `save_album_meta` | 读取 / 保存相册元数据 |
| `load_todos` / `save_todos` | 读取 / 保存待办 |
| `load_repos` / `save_repos` | 读取 / 保存仓库列表 |
| `load_settings` / `save_settings` | 读取 / 保存应用设置 |
| `fetch_repo` | 从 GitHub API 拉取仓库与最新 Release |
| `check_rate_limit` | 查询 GitHub API 速率限额 |
| `load_library_root` / `save_library_root` | 读取 / 保存图库根目录 |
| `load_repo_categories` / `save_repo_categories` | 读取 / 保存仓库分类 |

---

## 发布

推送 `v*` 形式的标签(或在 Actions 中手动触发 `Release` workflow)即会构建并发布:

```bash
git tag v0.1.0
git push origin v0.1.0
```

流程(`.github/workflows/release.yml`)当前只针对 Windows:

1. 安装 Rust stable 与 Bun 1.3.14,缓存 Cargo 依赖
2. `tauri-action` 构建 NSIS 安装包并创建 Draft Release
3. 额外上传一个免安装的便携版 exe(`memo-<version>-windows-x64-portable.exe`)、自动生成 Release Notes

> 便携版 exe 依赖系统已安装 Microsoft Edge WebView2 Runtime。

---

## 权限与配置

`src-tauri/capabilities/default.json` 为主窗口开放以下权限:

- `core:default` — 核心命令与事件
- `opener:default` — 使用系统默认程序打开链接
- `log:default` — 日志插件
- `dialog:default` — 原生文件/目录选择对话框

Rust 侧还注册了一个自定义插件 `external-navigation`,拦截 `http` / `https` / `mailto` / `tel` 跳转并交由系统浏览器处理。

---

## 路线图

- [ ] 跨平台发布(macOS / Linux)
- [ ] 图片基础编辑与批量重命名
- [ ] 待办与仓库的全局搜索、提醒通知
- [ ] 数据导入导出与备份
- [ ] 自动更新(`tauri-plugin-updater`)

---

## 致谢

界面基于 [shadcn/ui](https://ui.shadcn.com/) 的 dashboard 模板二次开发,图标来自 [lucide](https://lucide.dev/)。
