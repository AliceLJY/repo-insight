import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testsDir, "..");
const read = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");
const countOccurrences = (text, needle) => text.split(needle).length - 1;

const contract = read(
  "tests/fixtures/untrusted-repository-contract.txt",
).trim();
assert.ok(contract, "Safety contract fixture must not be empty.");

const mainSkillPath = "skills/repo-insight/SKILL.md";
const mainSkill = read(mainSkillPath);
const mainContractIndex = mainSkill.indexOf(contract);
assert.notEqual(
  mainContractIndex,
  -1,
  `${mainSkillPath} must contain the canonical safety contract.`,
);
assert.equal(
  countOccurrences(mainSkill, contract),
  1,
  `${mainSkillPath} must contain exactly one canonical safety contract.`,
);

for (const marker of [
  "## 核心原则",
  "**动手读代码前必做**",
  "### 阶段 1: 项目获取",
]) {
  const markerIndex = mainSkill.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${mainSkillPath} is missing ${marker}.`);
  assert.ok(
    mainContractIndex < markerIndex,
    `${mainSkillPath} must place the safety contract before ${marker}.`,
  );
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

const promptTemplates = [];
const skillDir = path.join(rootDir, "skills/repo-insight");
const headingPattern =
  /^#{1,6}\s+.*(?:Prompt 模板|Prompt Template).*$/gimu;

for (const filePath of markdownFiles(skillDir)) {
  const content = readFileSync(filePath, "utf8");
  for (const match of content.matchAll(headingPattern)) {
    const fenceStart = content.indexOf("```", match.index + match[0].length);
    assert.notEqual(
      fenceStart,
      -1,
      `${path.relative(rootDir, filePath)}: ${match[0]} has no fenced prompt.`,
    );
    const bodyStart = content.indexOf("\n", fenceStart);
    const fenceEnd = content.indexOf("\n```", bodyStart + 1);
    assert.notEqual(
      fenceEnd,
      -1,
      `${path.relative(rootDir, filePath)}: ${match[0]} has no closing fence.`,
    );
    promptTemplates.push({
      block: content.slice(bodyStart + 1, fenceEnd),
      file: path.relative(rootDir, filePath),
      heading: match[0].replace(/^#{1,6}\s+/, ""),
    });
  }
}

const requiredTemplates = [
  "核心模块 Subagent Prompt 模板",
  "次要模块批量 Prompt 模板",
];
const discoveredHeadings = new Set(
  promptTemplates.map(({ heading }) => heading),
);
for (const heading of requiredTemplates) {
  assert.ok(
    discoveredHeadings.has(heading),
    `Missing delegated prompt template: ${heading}.`,
  );
}

for (const { block, file, heading } of promptTemplates) {
  const contractIndex = block.indexOf(contract);
  assert.notEqual(
    contractIndex,
    -1,
    `${file}: ${heading} must contain the canonical safety contract.`,
  );
  assert.equal(
    countOccurrences(block, contract),
    1,
    `${file}: ${heading} must contain the safety contract exactly once.`,
  );
  for (const marker of [
    "## 背景信息",
    "## 需要分析的文件",
    "## 需要分析的次要模块",
  ]) {
    const markerIndex = block.indexOf(marker);
    if (markerIndex !== -1) {
      assert.ok(
        contractIndex < markerIndex,
        `${file}: ${heading} must place the contract before ${marker}.`,
      );
    }
  }
}

const packageManifest = JSON.parse(read("package.json"));
const pluginManifest = JSON.parse(read(".claude-plugin/plugin.json"));
assert.equal(
  packageManifest.version,
  pluginManifest.version,
  "package.json and .claude-plugin/plugin.json versions must match.",
);

assert.match(read("README.md"), /\[中文文档\]\(README_CN\.md\)/);
assert.match(read("README_CN.md"), /\[English README\]\(README\.md\)/);
assert.match(read("README.zh.md"), /\[README_CN\.md\]\(README_CN\.md\)/);

console.log(
  "Safety contract lint passed: main skill, " +
    `${promptTemplates.length} delegated prompt templates, version ` +
    `${packageManifest.version}.`,
);
