/** Regenerates public/skill.md from the single source of truth (SKILL_MARKDOWN). */
import { writeFileSync } from "node:fs";
import { SKILL_MARKDOWN } from "../src/modules/knowledge/references.js";
writeFileSync("public/skill.md", SKILL_MARKDOWN);
console.log("public/skill.md written (" + SKILL_MARKDOWN.length + " bytes)");
