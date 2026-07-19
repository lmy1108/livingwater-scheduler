# 活水日历（LivingWater Scheduler）— PRD + TDD

版本：v1.0 草案
日期：2026-07-19
状态：待评审

---

# 第一部分：产品需求文档（PRD）

## 1. 背景与问题

活水团契约 30 名成员，成员构成包括学生与在职人士，作息差异大。每次组织外出活动（出游、聚餐、退修会等）时，寻找共同可行的日期依赖群聊接龙或口头确认，信息分散、易过期、难以汇总，经常出现"问了一圈还是定不下来"的情况。

需要一个**轻量的共享可用性日历**：每个人标记自己在某些日期的忙碌 / 有空 / 不确定状态（可细分上午 / 下午，可附原因），所有人可查看聚合视图，快速识别"大多数人都有空"的候选日期。

## 2. 产品原则

1. **零门槛**：无需注册账号，选名字即可开始；一个共享密码保护写操作。
2. **互信优先**：任何人可修改任何人的状态（如替不方便上网的成员代填），以 `updated_by` 记录代替权限管控。
3. **诚实呈现**：未标记 = 未知，不默认算"有空"。聚合视图区分"已回应比例"与"有空比例"，避免误导决策。
4. **手机优先**：主要使用场景是手机，桌面端为增强体验。
5. **克制的范围**：v1 只做核心闭环（标记 → 查看 → 决策），推荐排序、重复模式等留待后续。

## 3. 目标与非目标

### 3.1 目标（v1 / P0）

- 成员可选择已有名字或创建新名字进入。
- 成员可对任意日期标记 忙碌 / 有空 / 不确定，粒度为全天或上午 / 下午，可附一句原因。
- 任何成员可代其他成员修改，修改记录保留"由谁、何时修改"。
- 月历热力图：按有空比例着色，一眼识别候选日期。
- 日期详情：点击日期查看每个人的状态与原因。
- 写操作由一个共享密码保护（验证一次后长期有效）。

### 3.2 Good-to-have（P1，v1 不实现）

- **找时间**：选定一次活动的参与人子集，自动对日期按可用性排序推荐。
- 人员矩阵视图（行 = 人，列 = 日期）作为高密度查看 / 批量编辑界面。
- 拖选批量标记连续日期。

### 3.3 非目标（明确不做）

- 每周重复的忙碌模式（后续版本再评估）。
- 账号体系、邮箱验证、OAuth。
- 通知 / 提醒（推送、邮件）。
- 具体到小时的时间粒度（只有 全天 / 上午 / 下午）。
- 多团契 / 多群组支持（单一群组硬编码）。
- 恶意行为防护（互信环境，仅共享密码 + 修改记录）。

## 4. 用户与场景

| 角色 | 描述 | 典型行为 |
|---|---|---|
| 普通成员 | 学生或在职，主要用手机 | 每月花 2 分钟标记自己的忙碌日期；活动前看热力图 |
| 组织者 | 团契同工，手机 + 电脑 | 查看热力图挑候选日期；在群里公布；代未填的成员补录 |
| 新成员 | 第一次使用 | 输入共享密码 → 创建自己的名字 → 标记日期 |

### 核心用户旅程

1. **首次进入**：打开链接 → 提示输入共享密码 → 通过后进入日历（30 天内免密）。
2. **认领身份**：从成员列表选择自己的名字；找不到则输入新名字创建（自动分配颜色）。
3. **标记状态**：在月历中点击某天 → 弹出详情抽屉 → 对"我"的行选择 忙碌 / 有空 / 不确定，选择 全天 / 上午 / 下午，可填原因 → 立即生效。
4. **查看决策**：切换月份浏览热力图 → 深绿色日期即候选 → 点开确认具体是谁不行、原因是什么 → 在群里发起确认。
5. **代人修改**：在日期详情中点其他成员的行，直接修改其状态（界面会记录"由 XX 修改"）。

## 5. 功能需求

### 5.1 身份与验证

| ID | 需求 | 优先级 |
|---|---|---|
| A1 | 首次访问需输入共享密码；验证在服务端完成，通过后签发 30 天有效的 httpOnly Cookie | P0 |
| A2 | 所有写操作（创建成员、修改状态）校验 Cookie；读操作同样需要（防止日历被公网爬取） | P0 |
| A3 | 成员列表展示所有已有名字 + 颜色；用户点选后本地记住"我是谁"（localStorage），下次自动带入 | P0 |
| A4 | 新建名字：输入 1–20 字符的显示名，去重校验（忽略首尾空格）；系统从预设调色板自动分配颜色 | P0 |
| A5 | 成员改名 / 删除：v1 不提供 UI，由维护者直接操作数据库 | P2 |

### 5.2 可用性标记

| ID | 需求 | 优先级 |
|---|---|---|
| M1 | 状态三态：`忙碌（红）/ 有空（绿）/ 不确定（黄）`；未标记 = 未知（灰） | P0 |
| M2 | 粒度：上午（AM）、下午（PM）。"全天"是 UI 快捷方式，落库为 AM + PM 两条记录 | P0 |
| M3 | 每条记录可附最长 50 字的原因（如"周三晚有课""出差"） | P0 |
| M4 | 任何已验证的用户可修改任何成员的记录；记录 `updated_by`（操作者名字）与 `updated_at` | P0 |
| M5 | 清除标记：可将某人某天某时段恢复为"未知"（删除记录） | P0 |
| M6 | 标记范围：允许标记过去日期（用于复盘），但 UI 默认聚焦当月与未来 | P1 |

### 5.3 月历热力图（主视图）

| ID | 需求 | 优先级 |
|---|---|---|
| C1 | 月视图，周日起始（可配置），支持前后翻月；默认当月 | P0 |
| C2 | 每个日期格背景色 = 有空比例色阶（见 5.5 算法）；AM/PM 有差异时格子上下分半着色 | P0 |
| C3 | 格内展示紧凑数字，如 `9✓ 3✗`（有空数 / 忙碌数）；不展示头像 | P0 |
| C4 | 格内以细进度条或角标呈现"已回应比例"（如 12/15），与颜色解耦 | P0 |
| C5 | 今天的日期格有明显描边 | P0 |
| C6 | 顶部图例说明颜色含义 | P1 |

### 5.4 日期详情抽屉

| ID | 需求 | 优先级 |
|---|---|---|
| D1 | 点击日期：手机端从底部弹出抽屉（bottom sheet），桌面端右侧滑出面板 | P0 |
| D2 | 抽屉内按分组展示成员：忙碌 / 不确定 / 有空 / 未回应，每人一行（颜色点 + 名字 + AM/PM 状态 + 原因） | P0 |
| D3 | 点任意成员行 → 展开行内编辑器：三态选择 × (全天 / 上午 / 下午) + 原因输入 + 清除按钮 | P0 |
| D4 | "我"的行置顶并高亮，一步可编辑 | P0 |
| D5 | 展示最近修改信息："由 张三 于 3 分钟前修改"（悬停 / 展开可见） | P1 |

### 5.5 聚合与着色算法

对某日期某时段（AM 或 PM）：

```
总人数 N        = members 总数
有空 F          = status = FREE 的人数
忙碌 B          = status = BUSY 的人数
不确定 U        = status = UNSURE 的人数
已回应 R        = F + B + U
未回应 (未知)   = N − R

有空比例 availRatio    = R > 0 ? F / R : null     // 分母是已回应者，不是全员
回应比例 responseRatio = R / N
```

**着色规则（日期格背景）：**

| 条件 | 颜色 |
|---|---|
| R = 0（无人回应） | 中性灰 |
| availRatio ≥ 0.8 且 R ≥ N × 0.5 | 深绿（强候选） |
| availRatio ≥ 0.8 但 R < N × 0.5 | 浅绿 + 虚线边框（"看起来好但回应少"） |
| 0.5 ≤ availRatio < 0.8 | 浅绿 |
| 0.2 ≤ availRatio < 0.5 | 浅黄 |
| availRatio < 0.2 | 浅红 |

> 设计意图：颜色回答"回应的人里有多少有空"，回应比例单独呈现（C4），两者不混合，防止"6/15 人回应、颜色却全绿"的误导。深绿额外要求回应过半，保证强候选可信。

**全天格着色**：AM 与 PM 档位相同 → 整格一色；不同 → 上下分半。

### 5.6 空态与边界

- 无任何成员时：引导创建第一个名字。
- 某月无任何标记：日历全灰 + 提示"还没有人标记本月"。
- 名字重复提交：提示已存在，引导选择而非创建。
- 网络失败：乐观更新回滚 + toast 提示重试。

## 6. 成功指标（非正式）

- 一次活动筹备中 ≥ 70% 目标参与者完成当月标记。
- 组织者能在 1 分钟内从热力图选出 2–3 个候选日期。
- 群聊中"接龙问时间"的消息显著减少（定性）。

---

# 第二部分：技术设计文档（TDD）

## 1. 技术选型总览

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | Next.js 15（App Router） | Vercel 原生支持；Server Actions 简化写路径 |
| 部署 | Vercel（Hobby 档即可） | 零运维 |
| 数据库 | Neon Postgres（免费档） | Serverless、分支、规模远超需求 |
| ORM | Drizzle ORM + `@neondatabase/serverless` | 轻量、类型安全、edge 兼容；Prisma 亦可 |
| 数据获取 | TanStack Query（React Query） | 乐观更新、窗口聚焦自动刷新、轮询 |
| 样式 | Tailwind CSS | 快速构建响应式 |
| 校验 | Zod | Server Action 入参校验 |
| 会话 | 自签 HMAC token 存 httpOnly Cookie | 无需引入 auth 库 |

**明确不引入**：WebSocket / 实时同步（轮询 + 聚焦刷新足够）、Redis、任何 auth SaaS。

## 2. 系统架构

```
[浏览器 (手机/桌面)]
   │  React Query: GET /api/month?ym=2026-08 （聚焦刷新 + 60s 轮询）
   │  Server Actions: setAvailability / clearAvailability / createMember / login
   ▼
[Vercel — Next.js App Router]
   │  middleware: 校验 session cookie（除 /login 与静态资源外全站拦截）
   ▼
[Neon Postgres]  ← pooled connection string（-pooler 后缀）
```

- 读路径：一个接口返回整月全员数据（≤ 30 人 × 31 天 × 2 时段 ≈ 1,860 行上限，实际远小于此），前端完成全部聚合计算。不做服务端聚合，逻辑留在一处（前端），便于视图迭代。
- 写路径：Server Actions，写库后 `revalidate` + 客户端乐观更新。

## 3. 数据模型

```sql
CREATE TABLE members (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(40) NOT NULL,
  color       VARCHAR(7)  NOT NULL,          -- '#E8654F' 调色板分配
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX members_name_uniq ON members (lower(trim(name)));

CREATE TYPE period_t AS ENUM ('AM', 'PM');
CREATE TYPE status_t AS ENUM ('BUSY', 'FREE', 'UNSURE');

CREATE TABLE availability (
  id          SERIAL PRIMARY KEY,
  member_id   INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date        DATE NOT NULL,                 -- 关键：DATE 类型，永不使用 timestamp
  period      period_t NOT NULL,
  status      status_t NOT NULL,
  note        VARCHAR(80),
  updated_by  VARCHAR(40) NOT NULL,          -- 操作者显示名（快照，不外键）
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, date, period)
);
CREATE INDEX availability_date_idx ON availability (date);
```

**设计决策说明**

1. **无 `FULL` 枚举**：全天 = 写 AM + PM 两行。upsert 语义单一（`ON CONFLICT (member_id, date, period) DO UPDATE`），彻底避免"已有全天记录、现改半天"的拆分逻辑。
2. **`date` 用 DATE 类型**：日期是"日历日"概念，与时区无关。前后端全程以 `'YYYY-MM-DD'` 字符串传递，禁止 `new Date(str)` 隐式解析（会按 UTC 解释导致跨时区偏移一天）。前端用 `date-fns` 的 `parse`/`format` 显式处理。
3. **`updated_by` 存名字快照而非外键**：成员将来若被删除，历史记录仍可读；互信环境不需要强一致的操作者身份。
4. **未来扩展预留**：P1 的"找时间"只需新增 `events` / `event_participants` 表，现有 schema 不需改动。

## 4. 认证与会话

```
POST login(password)
  ├─ 服务端比对 process.env.SHARED_PASSWORD（timingSafeEqual）
  ├─ 成功 → 生成 token = HMAC-SHA256(secret, "lw-session:" + expiry) + expiry
  └─ Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Max-Age=30d

middleware.ts（Edge）
  └─ 校验 cookie 签名与有效期；失败 → redirect /login
```

- 密码与 HMAC secret 均为 Vercel 环境变量；**任何密码比对不出现在客户端代码**。
- "我是谁"（当前选中的成员 id）仅存 localStorage，属 UI 便利而非安全边界——任何人本可修改任何人，无需防护。
- 轻量防爆破：login 路由按 IP 限 10 次 / 分钟（内存计数即可，Hobby 单实例足够）。

## 5. API 设计

### 5.1 读

```
GET /api/month?ym=2026-08
→ {
    members: [{ id, name, color }],
    entries: [{ memberId, date: "2026-08-15", period: "AM",
                status: "BUSY", note, updatedBy, updatedAt }]
  }
  Cache-Control: no-store
```

### 5.2 写（Server Actions，入参 Zod 校验）

```ts
login(password: string)
createMember(name: string)                       // → { id, name, color } | { error: "DUPLICATE" }

setAvailability({
  memberId: number,
  date: `${string}-${string}-${string}`,          // 'YYYY-MM-DD'
  periods: ('AM' | 'PM')[],                       // 全天 = ['AM','PM']
  status: 'BUSY' | 'FREE' | 'UNSURE',
  note?: string,
  actorName: string                               // 当前操作者显示名 → updated_by
})  // 实现：单事务内对每个 period 执行 upsert

clearAvailability({ memberId, date, periods })    // 删除记录 → 恢复"未知"
```

并发策略：**last-write-wins**。不做版本号 / 乐观锁；`updated_by + updated_at` 提供事后可见性，符合互信模型。

## 6. 前端设计

### 6.1 组件树

```
<App>
 ├─ <LoginGate>                    // 无有效会话时展示
 ├─ <IdentityPicker>               // 选名字 / 新建名字（首次或手动切换）
 └─ <CalendarPage>
     ├─ <MonthNav>                 // ← 2026年8月 →
     ├─ <Legend>                   // 颜色图例
     ├─ <HeatmapGrid>              // 7 列月格
     │    └─ <DayCell × ~35>       // 背景色 + 9✓3✗ + 回应比例条 + AM/PM 分半
     └─ <DayDrawer>                // 底部抽屉（<768px）/ 右侧面板（≥768px）
          ├─ <MyRow>               // 置顶的"我"
          ├─ <MemberRow × N>       // 按 忙碌/不确定/有空/未回应 分组
          └─ <InlineEditor>        // 三态 × 时段 × 原因 × 清除
```

### 6.2 状态与数据流

- React Query 单一 query key `['month', ym]`；`staleTime: 30s`，`refetchOnWindowFocus: true`，`refetchInterval: 60s`。
- 聚合计算（§PRD 5.5）封装为纯函数 `aggregateDay(members, entries, date, period)`，配单元测试；`useMemo` 按月缓存。
- **乐观更新**：mutation 的 `onMutate` 直接改写 query cache 中对应 entry → 格子立即变色；`onError` 回滚 + toast；`onSettled` invalidate。
- 翻月时 `prefetchQuery` 相邻月份，翻页无白屏。

### 6.3 移动端要点（主要场景）

- 日期格最小触控目标 44×44px；一行 7 格在 375px 宽下每格约 50px，格内内容只保留数字与色块。
- 抽屉用原生滚动 + `overscroll-behavior: contain`；拖拽把手 + 点击遮罩关闭。
- 三态选择用大号分段控件（segmented control），非下拉框。
- 全天 / 上午 / 下午为第二行分段控件，默认"全天"。
- 桌面端（≥768px）：日历居左，详情面板常驻右侧（无遮罩抽屉），日期格可展示更多信息（如前 3 个忙碌者名字缩写）。

### 6.4 色彩规范

| 语义 | 色值建议 |
|---|---|
| 深绿（强候选） | `#15803d` 底 / 白字 |
| 浅绿 | `#bbf7d0` |
| 浅黄 | `#fef08a` |
| 浅红 | `#fecaca` |
| 未知灰 | `#e5e7eb` |
| 成员调色板 | 12 色高区分度环形调色板，按创建顺序循环分配 |

注意红绿色弱可辨性：状态除颜色外均伴随符号（✓ ✗ ?）。

## 7. 时区与日期处理规范（全项目强制）

1. 数据库 `DATE` 类型；应用层日期一律为 `'YYYY-MM-DD'` 字符串。
2. 禁止 `new Date('2026-08-15')`（UTC 解析陷阱）；需要 Date 对象时用 `date-fns/parse` 按本地时区显式构造。
3. "今天"由客户端本地时间决定（成员均在美中时区，服务端 UTC 的"今天"可能相差一天）。
4. ESLint 自定义规则或 code review checklist 检查 `new Date(` 的字符串入参。

## 8. 部署与环境

```
环境变量（Vercel）
  DATABASE_URL      = postgres://...-pooler.neon.tech/...   # 必须 pooled
  SHARED_PASSWORD   = <团契共享密码>
  SESSION_SECRET    = <随机 32+ 字节>

分支策略
  main → Production；PR → Vercel Preview + Neon branch（预览环境隔离数据）
```

- Drizzle migrations 提交入库，`drizzle-kit push` 于部署前执行。
- 备份：Neon 免费档自带 PITR 窗口；另加每月一次 `pg_dump` 手动导出（数据量极小）。

## 9. 测试计划

| 层 | 内容 |
|---|---|
| 单元 | `aggregateDay` 着色算法全分支（含 R=0、回应不足半、AM/PM 分裂）；日期字符串工具函数 |
| 集成 | Server Actions：upsert 幂等、重名成员拒绝、未授权写入 401、clear 恢复未知 |
| E2E（Playwright，手机视口） | 登录 → 建名 → 标记全天忙碌 → 热力图变色 → 代他人修改 → updated_by 正确 |
| 手动 | iOS Safari / Android Chrome 真机抽屉手势与触控目标 |

## 10. 里程碑

| 阶段 | 内容 | 预估 |
|---|---|---|
| M1 | Schema + 登录 + 成员创建/选择 | 1–2 天 |
| M2 | 月历热力图（只读）+ 聚合算法 + 详情抽屉（只读） | 2–3 天 |
| M3 | 行内编辑 + 乐观更新 + 清除 + updated_by | 2 天 |
| M4 | 移动端打磨、空态、图例、E2E、上线 | 1–2 天 |

## 11. 风险与开放问题

| 风险 / 问题 | 应对 |
|---|---|
| 成员标记率低 → 热力图无参考价值 | 产品层面已用"回应比例"显性化；运营上组织者在群里带动填写 |
| 共享密码外泄 | 换密码 + 重新签发（改环境变量即自动失效旧会话，若把密码纳入 HMAC 输入） |
| 两人同时改同一条记录 | last-write-wins + updated_by 可见，接受 |
| 名字口语化重复（"小明" vs "明明"） | 创建页展示现有名单，社交约束解决 |
| 未来做"找时间"排序 | 聚合函数已纯函数化，排序 = 对候选日期按 (availRatio, responseRatio) 排序，无 schema 变更 |

## 附录 A：Good-to-have backlog（按优先级）

1. **找时间**：选参与人子集 → 日期按可用性排序推荐（P1）
2. 人员矩阵视图 + 拖选批量标记（P1）
3. 每周重复忙碌模式（P2）
4. 日期详情分享卡片（生成图片发群里）（P2）
5. 成员改名 / 归档 UI（P2）
6. ICS 导出（P3）
