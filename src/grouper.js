function groupBySubnet(entries) {
  const groups = {};

  for (const entry of entries) {
    const parts = entry.ip.split('.');
    const subnet = `${parts[0]}.${parts[1]}.0.0/16`;

    if (!groups[subnet]) groups[subnet] = [];
    groups[subnet].push(entry);
  }

  return groups;
}

function groupByProvider(entries) {
  const groups = {};

  for (const entry of entries) {
    if (!groups[entry.provider]) groups[entry.provider] = [];
    groups[entry.provider].push(entry);
  }

  return groups;
}

module.exports = { groupBySubnet, groupByProvider };
