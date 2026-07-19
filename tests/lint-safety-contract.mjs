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
  "<!-- repo-insight:principles-start -->",
  "<!-- repo-insight:repository-acquisition -->",
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
const templateMarkerPattern =
  /<!--\s*repo-insight:delegated-prompt\s+(core|secondary)\s*-->/giu;

for (const filePath of markdownFiles(skillDir)) {
  const content = readFileSync(filePath, "utf8");
  for (const match of content.matchAll(templateMarkerPattern)) {
    const markerEnd = match.index + match[0].length;
    const fenceStart = content.indexOf("```", markerEnd);
    assert.notEqual(
      fenceStart,
      -1,
      `${path.relative(rootDir, filePath)}: ${match[1]} has no fenced prompt.`,
    );
    const nextMarker = content.indexOf("<!-- repo-insight:delegated-prompt", markerEnd);
    assert.ok(
      nextMarker === -1 || fenceStart < nextMarker,
      `${path.relative(rootDir, filePath)}: ${match[1]} must be followed by its fenced prompt.`,
    );
    const bodyStart = content.indexOf("\n", fenceStart);
    const fenceEnd = content.indexOf("\n```", bodyStart + 1);
    assert.notEqual(
      fenceEnd,
      -1,
      `${path.relative(rootDir, filePath)}: ${match[1]} has no closing fence.`,
    );
    promptTemplates.push({
      block: content.slice(bodyStart + 1, fenceEnd),
      file: path.relative(rootDir, filePath),
      id: match[1].toLowerCase(),
    });
  }
}

const requiredTemplates = ["core", "secondary"];
const discoveredTemplates = new Set(promptTemplates.map(({ id }) => id));
assert.equal(
  discoveredTemplates.size,
  promptTemplates.length,
  "Delegated prompt markers must be unique.",
);
for (const id of requiredTemplates) {
  assert.ok(
    discoveredTemplates.has(id),
    `Missing delegated prompt template: ${id}.`,
  );
}

for (const { block, file, id } of promptTemplates) {
  const contractIndex = block.indexOf(contract);
  assert.notEqual(
    contractIndex,
    -1,
    `${file}: ${id} must contain the canonical safety contract.`,
  );
  assert.equal(
    countOccurrences(block, contract),
    1,
    `${file}: ${id} must contain the safety contract exactly once.`,
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
        `${file}: ${id} must place the contract before ${marker}.`,
      );
    }
  }
}

for (const maintainerOnlyReference of [
  /source\s+~\/\.[\w.-]+\.env/iu,
  /详见\s+memory\//u,
]) {
  assert.ok(
    !maintainerOnlyReference.test(mainSkill),
    `${mainSkillPath} must not depend on maintainer-only files.`,
  );
}

const gitignore = read(".gitignore");
for (const generatedPath of [".agents/", "skills-lock.json"]) {
  assert.ok(
    gitignore.split(/\r?\n/u).includes(generatedPath),
    `.gitignore must exclude ${generatedPath}.`,
  );
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
