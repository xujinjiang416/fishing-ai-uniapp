# 渔获 AI 小程序

基于 uni-app（Vue 3）的微信小程序，包含 AI 钓鱼天气、附近钓点、积分商城、订单与个人中心等页面。请求层统一走云托管 HTTPS 接口，不使用云开发数据库直连。

## 技术栈

- uni-app / Vue 3（Options API）
- 微信小程序（mp-weixin）
- HBuilderX 编译（项目没有 `package.json`，不能直接用 npm 构建）

## 目录结构

```text
fishing-ai-uniapp/
├─ common/             # 请求层、接口封装、状态与导航工具
│  ├─ env.js          # 多环境配置（唯一配置入口，按小程序版本自动匹配）
│  ├─ request.js       # 统一 HTTP 层（BASE_URL / token / 上传 / 401）
│  ├─ api.js           # 业务接口封装
│  └─ state.js
├─ pages/              # 小程序页面
├─ static/             # 静态资源
├─ manifest.json       # uni-app 应用配置
├─ project.config.json # 微信小程序项目配置（AppID 等）
└─ project.private.config.json
```

## 环境要求

- HBuilderX 5.x（建议 5.34 及以上）
- 微信开发者工具
- 小程序 AppID 的开发者权限

当前 AppID：`wx459890462809cc9c`（见 `project.config.json`）。

## 多环境配置

环境配置集中在 `common/env.js`，按微信运行版本自动匹配，不需要手动切换：

| 小程序版本 | `envVersion` | 使用环境 |
| --- | --- | --- |
| 开发版 | `develop` | 开发测试环境 |
| 体验版 | `trial` | 开发测试环境 |
| 正式版 | `release` | 生产环境 |

- 开发测试环境的云托管 API、云开发环境 ID、云托管服务名均已填写，开发版/体验版可直接调用全部云服务接口。
- 生产环境字段已预留（`apiBase` / `cloudEnv` / `cloudService` / `storageBase`），当前为空；购买生产云服务后只需填写这些字段，重新编译发布即可，业务代码无需改动。
- 生产环境未配置时，请求会直接返回「生产环境尚未配置服务地址」的明确错误，不会误连开发测试环境。
- `common/request.js` 只从 `common/env.js` 读取地址，页面与接口封装不感知具体环境。

真机调试如需连接本地后端，可临时把 `development.apiBase` 改为电脑局域网地址（不能用 `127.0.0.1`）。

注意：

- 开发/预览阶段在微信开发者工具「详情 → 本地设置」勾选「不校验合法域名」，或保持 `project.private.config.json` 中 `urlCheck=false`。
- 当前云开发环境为 PostgreSQL 模式，不支持绑定 callContainer，`useContainer` 保持 `false`，统一走 HTTPS。

## 本地运行

1. 用 HBuilderX 打开 `fishing-ai-uniapp` 目录（不要用 npm 初始化）。
2. 选择「运行 → 运行到小程序模拟器 → 微信开发者工具」。
3. 首次运行需在 HBuilderX 设置中配置微信开发者工具安装路径，并确保开发者工具已登录有该 AppID 权限的账号。
4. 运行 H5 时选择「运行 → 运行到浏览器」。

## 构建与预览

以下命令在 PowerShell 中执行，路径按本机实际安装位置替换。

源码编译：

```powershell
& "<HBuilderX安装目录>\cli.exe" publish mp-weixin `
  --project "<项目根目录>\fishing-ai-uniapp" `
  --name fishing-ai --appid wx459890462809cc9c
```

产物目录：

```text
fishing-ai-uniapp/unpackage/dist/build/mp-weixin
```

生成真机预览二维码：

```powershell
& "<微信开发者工具安装目录>\cli.bat" preview `
  --project "<项目根目录>\fishing-ai-uniapp\unpackage\dist\build\mp-weixin" `
  --qr-format image --qr-output "<项目根目录>\mp-preview.png"
```

也可以直接用微信开发者工具打开产物目录，手动预览或上传。

## 发布前检查

1. 在微信公众平台把云托管域名加入 `request 合法域名`，并把云存储网关域名加入 `downloadFile 合法域名`：

   ```text
   https://<云托管域名>
   https://<环境ID>.api.tcloudbasegateway.com
   ```

2. 确认隐私协议与位置权限说明已配置（`getLocation`、`chooseLocation`）。
3. 用 HBuilderX 重新编译，不要上传旧的 `unpackage` 产物。
4. 发布正式版前，确认 `common/env.js` 中 `production` 的云服务地址已填写；未购买生产云服务时，正式版会提示未配置，不会回退开发测试环境。
5. 在微信开发者工具中上传版本，然后到公众平台提交审核、发布。

## 注意事项

- `unpackage/` 是编译产物，已被 `.gitignore` 排除，不要提交。
- 仓库内不要写入任何服务端密钥；小程序只持有用户登录 token。
- 投稿/评论图片存公开云存储桶；退款凭证存私有桶，接口返回短期签名 URL，不要缓存或转发。
- `USE_CONTAINER` 仅在迁移到支持绑定小程序环境的传统云开发环境后才可改为 `true`。
