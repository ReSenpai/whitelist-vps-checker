function extractIPs(text) {
  const regex = /vless:\/\/[^@]+@([^:]+):/g;
  const ips = new Set();
  let match;

  while ((match = regex.exec(text)) !== null) {
    ips.add(match[1]);
  }

  return [...ips];
}

module.exports = { extractIPs };
