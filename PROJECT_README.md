# 学习笔记记录网站

一个简约风格的纯前端学习笔记记录应用，使用 Vue 3 + Element Plus + Dexie.js 构建，数据永久保存在浏览器 IndexedDB 中。

## 技术栈

- **Vue 3** - 使用 `<script setup>` 和 Composition API
- **Element Plus** - UI 组件库
- **Vue Router 4** - 路由管理
- **Dexie.js** - IndexedDB 封装库
- **Vite** - 构建工具
- **@element-plus/icons-vue** - Element Plus 图标库

## 项目结构

```
note2vue/
├── public/                      # 静态资源
│   └── writing.svg             # 网站图标
├── src/
│   ├── App.vue                 # 主应用组件（布局 + 全局搜索 + 左侧导航）
│   ├── main.js                 # 入口文件
│   ├── style.css               # 全局样式
│   ├── db/
│   │   └── index.js           # Dexie 数据库初始化
│   ├── composables/
│   │   ├── useCategories.js   # 分类管理逻辑
│   │   └── useNotes.js        # 笔记管理逻辑（含搜索）
│   ├── router/
│   │   └── index.js           # 路由配置
│   └── views/
│       ├── CategoriesView.vue         # 分类管理 + 搜索结果页面
│       ├── CategoryNotesView.vue      # 分类笔记列表页面
│       ├── NoteView.vue               # 笔记详情页（只读/编辑模式切换）
│       └── NoteFormView.vue           # 新建/编辑笔记表单页面
├── index.html                  # HTML 模板
└── package.json                # 项目配置
```

## 数据库设计

**数据库名**: `SimpleLearningNotes`

**Stores**:
- `categories`: `{ ++id, title }` - 学习分类
- `notes`: `{ ++id, categoryId, title, time, learned, doubt, nextGoal }` - 笔记

## 功能特性

### 分类管理
- 新增、编辑、删除分类
- 只能删除空分类
- 支持点击表格行直接查看笔记列表
- 表格操作按钮阻止冒泡，避免误跳转

### 笔记管理
- **智能分类关联**: 从分类页面新建笔记时自动关联当前分类，新建时隐藏分类选择器，直接显示分类名称
- 编辑笔记时可更改分类
- 查看笔记（只读模式，美观排版）
- 删除笔记
- 按时间降序排列
- 支持点击表格行直接查看笔记详情
- Tab 键缩进（在文本域中按 Tab 插入 2 个空格）

### 笔记字段
- **标题**: 笔记标题（必填，1-100 字符）
- **所属分类**: 关联学习分类
- **学习时间**: 记录学习的时间点
- **已学内容**: 本次学习的主要内容（必填）
- **仍有疑惑**: 学习后遗留的问题（可选）
- **下一个目标**: 下次学习的计划目标（可选）

### 全局搜索
- 搜索分类名称、笔记标题、已学内容、疑惑、下一个目标
- 300ms 防抖
- 使用 provide/inject 跨组件共享搜索关键词
- 显示搜索结果列表，可跳转到笔记详情

### 左侧导航菜单
- 使用 `el-menu` 组件实现
- 首页链接显示所有分类
- 分类链接可正常切换
- 路由参数变化时自动刷新数据

### 路由结构
- `/` 或 `/categories` - 分类管理页
- `/category/:id` - 某个分类的笔记列表
- `/note/new?categoryId=xx` - 新建笔记（支持 categoryId 参数自动关联分类）
- `/note/:id` - 笔记详情页（只读模式）
- `/note/:id/edit` - 编辑笔记（独立路由，优先级高于详情页）

## 核心实现

### 路由配置
路由顺序很重要：`/note/:id/edit` 必须放在 `/note/:id` 之前，否则编辑路由会被详情路由匹配到。

### 动态参数监听
`CategoryNotesView.vue` 使用 computed + watch 监听路由参数变化，确保分类切换时数据正确刷新。

### 智能分类关联
- 从分类笔记列表页点击"新建笔记"时，通过 URL 参数传递 `categoryId`
- `NoteFormView.vue` 检测到 `categoryId` 参数时，自动填充分类并隐藏分类选择器
- 使用计算属性 `categoryTitle` 实时显示分类名称

### 事件传播控制
表格操作按钮使用 `@click.stop` 阻止事件冒泡，避免点击按钮时触发行点击跳转。

### Tab 键缩进
文本域通过 `@keydown.tab.prevent` 拦截 Tab 键，在光标位置插入 2 个空格，并保持光标位置。

### 图标使用
项目使用 `@element-plus/icons-vue` 提供的图标库：
- `ArrowLeft`, `Plus` - 导航和操作
- `Edit`, `EditPen` - 编辑功能
- `Delete` - 删除操作
- 网站图标使用写作主题图标（writing.svg）

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 使用说明

1. 首次打开应用，点击"新增分类"创建学习科目（如：JavaScript、Vue、英语等）
2. 点击左侧导航菜单的分类或表格行进入笔记列表页
3. 点击"新建笔记"添加学习记录（自动关联当前分类）
4. 在笔记列表中点击表格行可查看笔记详情
5. 在笔记详情页点击"编辑"按钮可修改笔记内容
6. 顶部搜索框可全局搜索笔记内容
7. 编辑笔记时，按 Tab 键可在文本域中插入缩进
8. 所有数据自动保存在浏览器 IndexedDB 中，刷新页面不会丢失

## 设计风格

- 极简风格：白色/浅灰背景
- 主色调：柔和蓝色 (#409eff)
- 清晰的字体和适中的间距
- 全页面模式（笔记查看和编辑不使用弹窗）
- 响应式设计，支持移动端

## 更新日志

### v1.1.0
- 新增: 从分类页面新建笔记时自动关联分类
- 优化: 新建笔记时隐藏分类选择器，直接显示分类名称
- 更新: 网站图标为写作图标

### v1.0.0
- 初始版本发布
- 实现基础分类和笔记管理功能
- 支持全文搜索
- 响应式设计支持移动端
