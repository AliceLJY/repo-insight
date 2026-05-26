# Repo Insight

AI 编码助手技能，用于开源项目深度架构分析。不止于"用了什么技术"，而是回答"为什么这样设计"。

生成有深度洞察的专业架构报告，包含设计权衡分析、借鉴价值评估和 Mermaid 架构图。

兼容 [Claude Code](https://claude.ai/claude-code)、[Codex](https://github.com/openai/codex) 及任何支持 skills 格式的 AI 编码助手。

## 快速安装

**npx（推荐）**

```bash
npx skills add AliceLJY/repo-insight
```

**手动安装（Git Clone）**

```bash
# macOS / Linux
git clone https://github.com/AliceLJY/repo-insight.git ~/.claude/skills/repo-insight

# Windows
git clone https://github.com/AliceLJY/repo-insight.git %USERPROFILE%\.claude\skills\repo-insight
```

## 核心特性

- **Why > What 哲学** — 每个设计决策都解释动机、权衡和替代方案
- **自适应报告结构** — 没有固定模板，根据项目特征动态设计章节
- **Subagent 并行分析** — 为核心模块启动独立 agent 并行分析，附带覆盖率追踪
- **外部调研** — 分析代码前先搜索评价、爬取官网
- **交互式提问** — 根据项目特征生成针对性问题，不是固定清单
- **质量评估卡** — 星级评分，每个维度都有论证依据
- **借鉴价值** — 明确提炼可复用的设计模式和工程实践
- **Mermaid 图表** — 架构总览、数据流、模块时序图贯穿全文
- **4 级分析深度** — 从 30 秒速评到全覆盖深度分析

## 使用方法

直接对 Claude Code 说：

```
分析项目 https://github.com/astral-sh/ruff
```

```
/repo-insight ollama/ollama
```

```
对比分析 express vs fastify
```

支持 `owner/repo` 简写、GitHub/GitLab/Gitee 完整 URL 或本地路径。

## 分析模式

| 模式 | 核心模块覆盖率 | 次要模块覆盖率 | 适用场景 |
|------|-------------|-------------|---------|
| **速评** | 入口+README | — | 30秒判断值不值得深入 |
| **快速分析** | ≥30% | ≥10% | 快速了解项目全貌 |
| **标准分析**（默认） | ≥60% | ≥30% | 常规架构分析 |
| **深度分析** | ≥90% | ≥60% | 深入研究每个设计决策 |
| **对比分析** | 按需 | 按需 | 横向对比同类项目 |

## 工作流程

1. **克隆与扫描** — 克隆仓库，按模块统计有效代码行数
2. **规模评估** — 报告代码规模，让你选择分析深度
3. **外部调研** — 搜索评价 + 爬取官网 + 通读项目文档
4. **自适应提问** — 根据项目特征生成针对性问题
5. **动态报告设计** — 根据你的回答设计章节结构
6. **并行深度分析** — 启动 subagent 并行分析核心模块
7. **交叉验证** — 覆盖率检查 + 跨模块结论验证
8. **多源融合** — 融合所有素材，输出完整报告 + 质量评估卡

## 报告输出

最终报告保存在：

```
~/repo-analyses/{项目名}-{日期}/ANALYSIS_REPORT.md
```

每份报告包含（根据项目特征灵活调整）：

- **场景化问题引入** — 解决什么问题？现有方案为什么不够？
- **竞品定位** — 设计哲学差异（不是功能清单对比）
- **项目全景** — 架构速览
- **深度模块分析** — Why > What，附权衡分析和业界对比
- **借鉴价值** — 可复用的设计模式、工程实践、避坑指南
- **质量评估卡** — 星级评分，每个维度有论证
- **架构图** — Mermaid 图表贯穿全文

## 文件结构

```
repo-insight/
├── skills/
│   └── repo-insight/
│       ├── SKILL.md                        # 主技能定义
│       └── references/
│           ├── analysis-guide.md           # 分析哲学与评价框架
│           └── module-analysis-guide.md    # 模块分析指南与 subagent 模板
├── .claude-plugin/
│   └── plugin.json                         # 插件元数据
├── package.json                            # 包描述
├── README.md                               # English documentation
├── README.zh.md                            # 中文文档
└── LICENSE                                 # MIT License
```

## 贡献

欢迎提 Issue 或 PR！

核心逻辑在 `skills/repo-insight/SKILL.md`，评价框架和 subagent 模板在 `references/` 目录。

## 许可证

[MIT](LICENSE)
