#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { runPipeline } = require('./src/index');
const { writeJSON } = require('./src/writer');
const { formatResult } = require('./src/formatter');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Использование: node cli.js <input.txt> [output.json]');
  console.error('  input.txt   — файл с VLESS-ссылками');
  console.error('  output.json — результат (по умолчанию: result.json)');
  process.exit(1);
}

const inputFile = path.resolve(args[0]);
const outputFile = path.resolve(args[1] || 'result.json');

if (!fs.existsSync(inputFile)) {
  console.error(`Файл не найден: ${inputFile}`);
  process.exit(1);
}

async function main() {
  const text = fs.readFileSync(inputFile, 'utf-8');

  console.error(`Читаю ${inputFile}...`);
  console.error(`Запускаю анализ...\n`);

  const result = await runPipeline(text);

  writeJSON(outputFile, result);

  console.log(formatResult(result));
  console.error(`\nРезультат сохранён в ${outputFile}`);
}

main().catch((err) => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
