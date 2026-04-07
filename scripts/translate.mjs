#!/usr/bin/env node

/**
 * Pre-build translation script.
 * Reads English source content, calls an OpenAI-compatible inference endpoint,
 * and writes translated files for each target locale.
 *
 * Usage:
 *   node scripts/translate.mjs
 *
 * Environment variables:
 *   TRANSLATION_API_URL  - Endpoint URL (default: http://127.0.0.1:8981)
 *   TRANSLATION_API_KEY  - API key (default: none)
 *   TRANSLATION_MODEL    - Model name (default: default)
 */

import OpenAI from 'openai';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';

const API_URL = process.env.TRANSLATION_API_URL || 'http://127.0.0.1:8981';
const API_KEY = process.env.TRANSLATION_API_KEY || 'not-needed';
const MODEL = process.env.TRANSLATION_MODEL || 'default';

const ROOT = new URL('..', import.meta.url).pathname;
const CACHE_FILE = join(ROOT, '.translation-cache.json');

const TARGET_LOCALES = ['es-ar', 'es-uy'];

const LOCALE_INSTRUCTIONS = {
  'es-ar': 'Translate to Spanish as spoken in Argentina. Use voseo (vos instead of tú), Argentine vocabulary and expressions.',
  'es-uy': 'Translate to Spanish as spoken in Uruguay. Use Uruguayan vocabulary and expressions (similar to Rioplatense Spanish but with Uruguayan specifics).',
};

const client = new OpenAI({
  baseURL: API_URL.endsWith('/v1') ? API_URL : `${API_URL.replace(/\/$/, '')}/v1`,
  apiKey: API_KEY,
});

// --- Cache ---

async function loadCache() {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { version: 1, entries: {} };
  }
}

async function saveCache(cache) {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
}

function computeHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

function isCached(cache, filePath, hash) {
  const entry = cache.entries[filePath];
  if (!entry || entry.hash !== hash) return false;
  return TARGET_LOCALES.every((l) => entry.locales?.includes(l));
}

// --- AI Translation ---

async function callAI(systemPrompt, userPrompt) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });

  return completion.choices?.[0]?.message?.content ?? '';
}

function extractJSON(text) {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  // Try to parse the whole text as JSON
  return JSON.parse(text.trim());
}

// --- MDX Translation ---

function parseMDX(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: content, raw: content };
  return { frontmatter: match[1], body: match[2], raw: content };
}

function parseFrontmatter(fm) {
  const result = {};
  let currentKey = null;
  let currentValue = '';
  let isMultiline = false;

  for (const line of fm.split('\n')) {
    if (!isMultiline) {
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        if (currentKey) result[currentKey] = currentValue.trim();
        currentKey = keyMatch[1];
        const val = keyMatch[2];
        if (val === '|' || val === '>') {
          isMultiline = true;
          currentValue = '';
        } else {
          isMultiline = false;
          currentValue = val.replace(/^["']|["']$/g, '');
        }
      }
    } else {
      if (line.match(/^\w+:/) && !line.startsWith('  ')) {
        if (currentKey) result[currentKey] = currentValue.trim();
        const keyMatch = line.match(/^(\w+):\s*(.*)$/);
        currentKey = keyMatch[1];
        const val = keyMatch[2];
        if (val === '|' || val === '>') {
          isMultiline = true;
          currentValue = '';
        } else {
          isMultiline = false;
          currentValue = val.replace(/^["']|["']$/g, '');
        }
      } else {
        currentValue += (currentValue ? '\n' : '') + line.replace(/^  /, '');
      }
    }
  }
  if (currentKey) result[currentKey] = currentValue.trim();
  return result;
}

// Fields that should be translated in frontmatter
const TRANSLATABLE_FIELDS = ['title', 'description', 'role', 'period', 'location', 'summary'];

async function translateMDX(filePath, content, locale) {
  const { frontmatter, body } = parseMDX(content);
  const parsed = parseFrontmatter(frontmatter);

  // Collect translatable fields
  const toTranslate = {};
  for (const field of TRANSLATABLE_FIELDS) {
    if (parsed[field]) toTranslate[field] = parsed[field];
  }

  const hasBody = body.trim().length > 0;

  const systemPrompt = `You are a professional translator. ${LOCALE_INSTRUCTIONS[locale]}
Keep technical terms, product names, company names, and proper nouns unchanged.
Preserve all Markdown/MDX formatting, links, and code blocks exactly as they are.
Return ONLY valid JSON with no extra text.`;

  const input = { frontmatter: toTranslate };
  if (hasBody) input.body = body.trim();

  const userPrompt = `Translate the following content. Return a JSON object with:
- "frontmatter": an object with the translated values for these keys: ${Object.keys(toTranslate).join(', ')}
${hasBody ? '- "body": the translated MDX body content' : ''}

Input:
${JSON.stringify(input, null, 2)}`;

  const response = await callAI(systemPrompt, userPrompt);
  const translated = extractJSON(response);

  // Rebuild the MDX file with translated content
  let newFrontmatter = frontmatter;
  for (const [key, value] of Object.entries(translated.frontmatter || {})) {
    const escapedValue = value.replace(/"/g, '\\"');
    // Handle multiline values (summary with |)
    if (parsed[key] && parsed[key].includes('\n')) {
      const regex = new RegExp(`(${key}:\\s*\\|\\n)([\\s\\S]*?)(?=\\n\\w+:|$)`);
      const indentedValue = value.split('\n').map(l => `  ${l}`).join('\n');
      newFrontmatter = newFrontmatter.replace(regex, `$1${indentedValue}\n`);
    } else {
      const regex = new RegExp(`(${key}:\\s*)(.+)$`, 'm');
      newFrontmatter = newFrontmatter.replace(regex, `$1"${escapedValue}"`);
    }
  }

  const newBody = hasBody && translated.body ? translated.body : body;
  return `---\n${newFrontmatter}\n---\n${newBody}`;
}

// --- JSON Translation ---

async function translateUIStrings(content, locale) {
  const en = JSON.parse(content);

  const systemPrompt = `You are a professional translator. ${LOCALE_INSTRUCTIONS[locale]}
Keep proper nouns unchanged. Return ONLY valid JSON with no extra text.`;

  const userPrompt = `Translate the following UI strings JSON object. Keep the keys exactly the same, only translate the values.

${JSON.stringify(en, null, 2)}`;

  const response = await callAI(systemPrompt, userPrompt);
  return JSON.stringify(extractJSON(response), null, 2) + '\n';
}

async function translateCredentials(content, locale) {
  const data = JSON.parse(content);

  const systemPrompt = `You are a professional translator. ${LOCALE_INSTRUCTIONS[locale]}
Keep product names, technology names, and proper nouns unchanged.
Translate only category names (the object keys) and skill names/types where appropriate.
Return ONLY valid JSON with no extra text, preserving the exact same structure.`;

  const userPrompt = `Translate the following credentials JSON. The top-level keys are category names that should be translated. Within each entry, translate the "name" and "type" fields only when they describe a skill (not a product name). Keep "product", "namelnk", and "typelnk" unchanged.

${JSON.stringify(data, null, 2)}`;

  const response = await callAI(systemPrompt, userPrompt);
  return JSON.stringify(extractJSON(response), null, 2) + '\n';
}

// --- File Discovery ---

async function findMDXFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMDXFiles(fullPath)));
    } else if (entry.name.endsWith('.mdx') && !entry.name.match(/\.(es-ar|es-uy)\.mdx$/)) {
      files.push(fullPath);
    }
  }
  return files;
}

// --- Main ---

async function main() {
  console.log('🌐 Translation script starting...');
  console.log(`   API endpoint: ${API_URL}`);
  console.log(`   Target locales: ${TARGET_LOCALES.join(', ')}`);

  const cache = await loadCache();
  let translated = 0;
  let skipped = 0;

  // 1. Translate UI strings (src/i18n/en.json)
  const uiPath = join(ROOT, 'src/i18n/en.json');
  const uiContent = await readFile(uiPath, 'utf-8');
  const uiHash = computeHash(uiContent);
  const uiRelPath = 'src/i18n/en.json';

  if (!isCached(cache, uiRelPath, uiHash)) {
    console.log(`\n📝 Translating UI strings...`);
    for (const locale of TARGET_LOCALES) {
      console.log(`   → ${locale}`);
      const result = await translateUIStrings(uiContent, locale);
      await writeFile(join(ROOT, `src/i18n/${locale}.json`), result);
    }
    cache.entries[uiRelPath] = { hash: uiHash, locales: [...TARGET_LOCALES] };
    translated++;
  } else {
    console.log(`\n✅ UI strings: cached (skipped)`);
    skipped++;
  }

  // 2. Translate credentials.json
  const credPath = join(ROOT, 'src/data/credentials.json');
  const credContent = await readFile(credPath, 'utf-8');
  const credHash = computeHash(credContent);
  const credRelPath = 'src/data/credentials.json';

  if (!isCached(cache, credRelPath, credHash)) {
    console.log(`\n📝 Translating credentials...`);
    for (const locale of TARGET_LOCALES) {
      console.log(`   → ${locale}`);
      const result = await translateCredentials(credContent, locale);
      await writeFile(join(ROOT, `src/data/credentials.${locale}.json`), result);
    }
    cache.entries[credRelPath] = { hash: credHash, locales: [...TARGET_LOCALES] };
    translated++;
  } else {
    console.log(`✅ Credentials: cached (skipped)`);
    skipped++;
  }

  // 3. Translate MDX content files
  const contentDir = join(ROOT, 'src/content');
  const mdxFiles = await findMDXFiles(contentDir);

  console.log(`\n📄 Found ${mdxFiles.length} MDX files to check`);

  for (const mdxPath of mdxFiles) {
    const relPath = mdxPath.replace(ROOT, '');
    const content = await readFile(mdxPath, 'utf-8');
    const hash = computeHash(content);

    if (isCached(cache, relPath, hash)) {
      skipped++;
      continue;
    }

    const name = basename(mdxPath, '.mdx');
    const dir = dirname(mdxPath);

    console.log(`   📝 Translating ${relPath}...`);

    for (const locale of TARGET_LOCALES) {
      console.log(`      → ${locale}`);
      try {
        const result = await translateMDX(mdxPath, content, locale);
        const outPath = join(dir, `${name}.${locale}.mdx`);
        await writeFile(outPath, result);
      } catch (err) {
        console.error(`      ❌ Failed: ${err.message}`);
      }
    }

    cache.entries[relPath] = { hash, locales: [...TARGET_LOCALES] };
    translated++;
  }

  await saveCache(cache);

  console.log(`\n🏁 Done! Translated: ${translated}, Skipped (cached): ${skipped}`);
}

main().catch((err) => {
  console.error('Translation failed:', err);
  process.exit(1);
});
