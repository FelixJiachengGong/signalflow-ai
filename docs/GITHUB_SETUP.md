# 创建 GitHub 仓库并推送

当前版本：**Phase 1 - Rule-based MVP**。目标仓库：[FelixJiachengGong/signalflow-ai](https://github.com/FelixJiachengGong/signalflow-ai)。下文保留首次发布步骤供复现；仓库初始化完成后，日常更新直接使用第 6 节。

## 1. 创建空仓库

登录 GitHub，打开 [New repository](https://github.com/new)。

- Owner：你的个人账号。
- Repository name：`signalflow-ai`。
- Description：`An explainable product decision dashboard using synthetic feedback. Phase 1 - Rule-based MVP.`
- Visibility：`Public`。
- 不预置 README、.gitignore 或 License：本地已准备好 README 和 .gitignore，空仓库能避免首次推送冲突。
- 点击 Create repository，复制页面上的 HTTPS 仓库地址。

示例格式：`https://github.com/YOUR_USERNAME/signalflow-ai.git`。`YOUR_USERNAME` 要换成你的实际账号名。建仓流程依据 [GitHub 官方说明](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)。

## 2. 在终端进入项目目录

进入保存项目的文件夹。例如，在终端输入 `cd `（注意后面的空格），把项目文件夹拖进终端，再按回车。

确认目录包含 `README.md`、`index.html`、`src/` 和 `data/`：

```bash
ls
```

## 3. 初始化 Git 并提交

仅在项目尚未初始化 Git 时运行下面步骤；已有 `.git` 的项目跳过 `git init`：

```bash
git init -b main
git add .
git status --short
git diff --cached --stat
```

检查待提交文件应包含代码、模拟数据、测试、说明和截图；忽略规则已排除环境文件、缓存和本地工具目录。确认后提交：

```bash
git commit -m "Initial release: Phase 1 - Rule-based MVP"
```

如果 Git 提示 `Author identity unknown`，先设置**本仓库**的提交身份，再执行 commit：

```bash
git config user.name "YOUR_NAME"
git config user.email "YOUR_GITHUB_COMMIT_EMAIL"
```

把占位值替换为你的名字和提交邮箱。可以使用 GitHub Settings → Emails 中显示的 noreply 邮箱。

## 4. 登录并推送

通过 HTTPS 推送需要命令行认证；GitHub 不接受账户密码作为 Git 密码。[官方认证说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)

如果已经安装 GitHub CLI，可运行：

```bash
gh auth login
```

选择 GitHub.com → HTTPS → 浏览器登录，并完成 Git 认证设置。如果没有 CLI，可以用已配置的凭证管理器，或在 Git 的密码提示处使用个人访问令牌。令牌仅输入认证提示，不要写进远程 URL 或项目文件。

把下一行的 `YOUR_USERNAME` 换成真实账号：

```bash
git remote add origin https://github.com/YOUR_USERNAME/signalflow-ai.git
git remote -v
git push -u origin main
```

如果 `origin` 已存在，先检查 `git remote -v`。仅当地址确实不正确时，再改为实际仓库地址：

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/signalflow-ai.git
```

如果提示远端已有提交，通常是创建时预置了 README 等文件。先查看远端内容并合并历史，或改用新的空仓库；不要直接强制推送。

命令流程依据 [GitHub：将本地代码添加到 GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。

## 5. 确认作品集展示

刷新 GitHub 仓库页面，确认：

- README 自动显示，标题下明确写着 `Phase 1 - Rule-based MVP`。
- 总览截图正常显示；功能截图位置在 `docs/screenshots/`。
- `data/feedback.json`、`src/`、`tests/` 已上传。
- 能按 README 在另一台电脑启动网页。

可在仓库 About 中使用上述 Description，添加 Topics：`product-management`、`portfolio`、`feedback-analysis`、`rule-based`、`javascript`。

推送代码只发布仓库，不会启动线上网页。仓库中的 `localhost` 地址需要读者自行在本地运行。当前没有配置 GitHub Pages 或其他部署。

## 6. 后续更新

在项目目录运行：

```bash
git add .
git diff --cached --stat
git commit -m "Describe your update"
git push
```

当前未指定开源许可证。公开仓库不等于已经授予开源许可；若希望他人按开源条款使用，再选择并添加合适的 LICENSE。
