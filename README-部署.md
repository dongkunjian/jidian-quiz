# 一建机电刷题系统 · 部署说明

这是一个**纯静态网页**（HTML+CSS+JS，无后端、无数据库），任何静态托管都能直接运行。
当前目录已初始化为 git 仓库，首次提交完成。

## 上线后的效果
- 网址永久固定在你自己的域名下，不再受任何平台账号限制。
- 以后每节更新题库：本地改完 → git commit → git push，Cloudflare 自动重新部署。
- iPad 加桌面图标后永久有效（网址不变）。
- 刷题进度存在浏览器本地（localStorage）。换域名时：旧网址点「导出进度」复制备份串 → 新网址点「导入进度」粘贴即可，进度不丢。

---

## 方案 A：Cloudflare Pages + GitHub（推荐，一次配置，以后 push 即自动更新）

### 第 1 步：把本地仓库推到 GitHub
1. 在 GitHub 网页上新建一个仓库（New repository），例如名字 `jidian-quiz`。
   - 建议选 **Private（私有）** 也可以，Cloudflare Pages 支持连接私有仓库。
   - **不要**勾选 Initialize with README（保持空仓库）。
2. 建好后，GitHub 会显示一段"push an existing repository"的命令。在本目录（`F:\一建\复习系统\刷题`）打开 Git Bash，依次执行：

   ```bash
   git remote add origin https://github.com/你的用户名/jidian-quiz.git
   git branch -M main
   git push -u origin main
   ```
   把"你的用户名"和仓库名换成你实际的。若弹出登录，用浏览器登录 GitHub 授权即可。

### 第 2 步：在 Cloudflare Pages 连接仓库
1. 登录 Cloudflare → 左侧菜单 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选择 GitHub → 授权 → 选中刚建的 `jidian-quiz` 仓库。
3. 构建配置（Build settings）：
   - Framework preset：**None**（或 Static）
   - Build command：**留空**
   - Build output directory：**`/`**（根目录，即留默认）
4. 点 **Save and Deploy**，等 1~2 分钟，得到一个 `xxx.pages.dev` 的网址。

### 第 3 步：绑定你的免费域名
1. 在刚部署的 Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入你的域名。
2. 按提示到你的域名 DNS 管理处添加一条 CNAME 记录（Cloudflare 会自动给出目标地址）。
3. 若你的域名已经在 Cloudflare 托管，它会自动配置，通常几分钟内生效，并自动签发 HTTPS 证书。

### 第 4 步：迁移刷题进度
1. 打开**旧网址** `https://jidian-quiz-05012.app.workbuddy.host/?sharecode=PVPULR6GSW` → 点「导出进度」→ 复制备份串。
2. 打开**新网址** → 点「导入进度」→ 粘贴 → 确认。进度完全恢复。
3. iPad：删掉旧桌面图标，用新网址的「📱扫码」重新加一次。

### 以后每次更新题库
本地改完题库文件后，在本目录执行：
```bash
git add -A
git commit -m "更新第X节题库"
git push
```
Cloudflare 会自动重新部署，网址不变，iPad 打开即新版。

---

## 方案 B：直接上传（不想用 git 时的兜底）

同目录的 `../一建机电刷题系统-部署包.zip` 是完整静态站打包。
在 Cloudflare Pages → Create → Pages → **Upload assets**，把这个 zip 解压后的文件夹拖进去即可。
缺点：以后每次更新都要重新上传整个文件夹，不如方案 A 省事。

---

## 方案 C：GitHub Pages（免费，但国内访问不稳定）

1. 按方案 A 第 1 步 push 到 GitHub。
2. 仓库 → Settings → Pages → Source 选 `main` / `/ (root)` → Save。
3. 得到 `https://你的用户名.github.io/jidian-quiz/`。
4. 注意：GitHub Pages 在国内访问经常超时，iPad 刷题体验较差；如用此方案建议绑自己的域名加速。

---

## 本地预览
双击 `index.html` 即可在本机浏览器打开（file:// 模式下扫码按钮会提示需 https，其余功能正常）。
或在本目录执行 `python -m http.server 8000`，浏览器访问 `http://localhost:8000`。

---

## 进度云同步（重要）

### 为什么需要
浏览器进度存在 `localStorage`，它**按域名隔离**。本站先后用过 workbuddy 临时链接、`pages.dev`、`jd.yiyoo.ccwu.cc`，每个域名各存一套空白记录；iPad「添加到主屏幕」又是独立存储。所以换域名/换设备看起来像"记录丢了"——**不是代码清空**。

### 现在的做法
- 前端每次保存进度，都会防抖 1.2s 后 `POST api/sync?k=...`，把整份进度存到 Cloudflare KV。
- 打开页面时先本地渲染（秒开），再异步 `GET api/sync` 拉云端，用 `mergeProgress()` 合并：题记录 right/wrong/streak **取较大值**、卡片取并集、连续天数取大、日期取晚。
- 顶栏 `☁ 已同步` / `☁ 仅本地` 指示状态。**云端不可用时静默降级**，照常本地刷题，恢复网络后自动补传。
- "重置进度"会带 `epoch`（时间戳）清空云端，避免旧记录被合并回来。

### 后端在哪
- `functions/api/sync.js` —— Cloudflare Pages Function，随站点自动部署到 `https://jd.yiyoo.ccwu.cc/api/sync`（同域，无跨域、无需代理）。
- KV namespace：`JIDIAN_PROGRESS`，id `75c134592fb5429fb84f40314b22b1c6`，绑定名 `PROGRESS`（已在 Pages 项目 production/preview 两个环境绑定）。
- 同步码：`?k=jidian2027`（写在前端 `SYNC_URL` 与 Function 的 `TOKEN`，改要两边一起改）。

### 以后要改
- 改 KV 绑定：`wrangler.toml` 不能用于 Pages 项目绑定，必须走 API：
  `PATCH /accounts/{id}/pages/projects/jidian-quiz`，body 里 `deployment_configs.<env>.kv_namespaces = {"PROGRESS":{"namespace_id":"..."}}`（是**对象映射**，不是数组）。
- 手动读云端：`curl "https://jd.yiyoo.ccwu.cc/api/sync?k=jidian2027"`
