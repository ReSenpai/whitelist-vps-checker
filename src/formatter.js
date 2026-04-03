const W = 60;

const line = (ch, w = W) => ch.repeat(w);
const pad = (str, w) => str + ' '.repeat(Math.max(0, w - str.length));
const padL = (str, w) => ' '.repeat(Math.max(0, w - str.length)) + str;

function box(title, lines) {
  const inner = W - 4;
  const out = [];
  const titlePad = Math.max(0, inner - title.length);
  const left = Math.floor(titlePad / 2);
  const right = titlePad - left;

  out.push(`╔${'═'.repeat(W - 2)}╗`);
  out.push(`║ ${' '.repeat(left)}${title}${' '.repeat(right)} ║`);
  out.push(`╠${'═'.repeat(W - 2)}╣`);

  for (const l of lines) {
    const trimmed = l.slice(0, inner);
    out.push(`║ ${pad(trimmed, inner)} ║`);
  }

  out.push(`╚${'═'.repeat(W - 2)}╝`);
  return out.join('\n');
}

function bar(value, max, width = 20) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatResult(result) {
  const { stats, bySubnet, byProvider } = result;
  const sections = [];

  // Header
  sections.push(box('IP SCANNER & ANALYZER', [
    '',
    `  Results generated at ${new Date().toISOString().slice(0, 19)}`,
    '',
  ]));

  // Stats
  const statsLines = [
    '',
    `  Total lines ............ ${padL(String(stats.total), 6)}`,
    `  Unique IPs ............. ${padL(String(stats.uniqueIPs), 6)}`,
    `  Alive .................. ${padL(String(stats.alive), 6)}`,
    `  Dead ................... ${padL(String(stats.dead), 6)}`,
    `  Subnets /16 ............ ${padL(String(stats.subnets), 6)}`,
    `  Providers .............. ${padL(String(stats.providers), 6)}`,
    '',
  ];
  sections.push(box('STATS', statsLines));

  // Providers table with bar chart
  const sorted = Object.entries(stats.providerList).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length > 0 ? sorted[0][1] : 0;
  const provLines = [''];

  for (const [name, count] of sorted) {
    const nameCol = pad(name.slice(0, 24), 24);
    const countCol = padL(String(count), 4);
    const barCol = bar(count, maxCount, 14);
    provLines.push(`  ${nameCol} ${countCol} ${barCol}`);
  }
  provLines.push('');
  sections.push(box('PROVIDERS', provLines));

  // Subnets
  const subnetEntries = Object.entries(bySubnet).sort((a, b) => b[1].length - a[1].length);
  const subLines = [''];

  for (const [subnet, ips] of subnetEntries) {
    subLines.push(`  ┌─ ${subnet} (${ips.length} IPs)`);
    for (let i = 0; i < ips.length; i++) {
      const e = ips[i];
      const prefix = i === ips.length - 1 ? '└' : '├';
      const prov = e.provider ? ` [${e.provider}]` : '';
      subLines.push(`  │ ${prefix}─ ${e.ip}${prov}`);
    }
    subLines.push('  │');
  }
  if (subLines.length > 1) subLines.pop(); // remove trailing │
  subLines.push('');
  sections.push(box('SUBNETS', subLines));

  return sections.join('\n\n');
}

module.exports = { formatResult };
