const pLimit = require('p-limit');
const { extractIPs } = require('./parser');
const { checkIP } = require('./checker');
const { getProviderBatch } = require('./resolver');
const { groupBySubnet, groupByProvider } = require('./grouper');

async function runPipeline(text, options = {}) {
  const { concurrency = 20, port = 80, timeout = 3000 } = options;
  const limit = pLimit(concurrency);

  // 1. Parse
  const allLines = text.split('\n').filter((l) => l.trim());
  const ips = extractIPs(text);

  // 2. Check availability
  const checkResults = await Promise.all(
    ips.map((ip) => limit(async () => {
      const check = await checkIP(ip, port, timeout);
      return {
        ip,
        port,
        alive: check.alive,
        reason: check.reason,
      };
    }))
  );

  const aliveIPs = checkResults.filter((r) => r.alive).map((r) => r.ip);
  const deadCount = checkResults.filter((r) => !r.alive).length;

  // 3. Resolve providers (batch API — up to 100 IPs per request)
  const providerMap = await getProviderBatch(aliveIPs);
  const entries = aliveIPs.map((ip) => {
    const { isp, asn, raw } = providerMap.get(ip);
    return { ip, provider: isp, asn, apiResponse: raw };
  });

  // 4. Group
  const bySubnet = groupBySubnet(entries.map(({ ip, provider, asn }) => ({ ip, provider, asn })));
  const byProvider = groupByProvider(entries.map(({ ip, provider, asn }) => ({ ip, provider, asn })));

  // 5. Detailed checks
  const checks = checkResults.map((cr) => {
    const resolved = entries.find((e) => e.ip === cr.ip);
    return {
      ip: cr.ip,
      tcp: { port: cr.port, alive: cr.alive, reason: cr.reason },
      api: resolved ? resolved.apiResponse : null,
    };
  });

  // 6. Stats
  const providerCounts = {};
  for (const e of entries) {
    providerCounts[e.provider] = (providerCounts[e.provider] || 0) + 1;
  }

  const stats = {
    total: allLines.length,
    uniqueIPs: ips.length,
    alive: aliveIPs.length,
    dead: deadCount,
    subnets: Object.keys(bySubnet).length,
    providers: Object.keys(byProvider).length,
    providerList: providerCounts,
  };

  return { bySubnet, byProvider, checks, stats };
}

module.exports = { runPipeline };
