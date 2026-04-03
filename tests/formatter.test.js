const { formatResult } = require('../src/formatter');

describe('formatResult', () => {
  const result = {
    bySubnet: {
      '1.1.0.0/16': [
        { ip: '1.1.1.1', provider: 'CloudFlare', asn: 'AS13335' },
        { ip: '1.1.2.2', provider: 'CloudFlare', asn: 'AS13335' },
      ],
      '8.8.0.0/16': [
        { ip: '8.8.8.8', provider: 'Google LLC', asn: 'AS15169' },
      ],
    },
    byProvider: {
      CloudFlare: [
        { ip: '1.1.1.1', provider: 'CloudFlare', asn: 'AS13335' },
        { ip: '1.1.2.2', provider: 'CloudFlare', asn: 'AS13335' },
      ],
      'Google LLC': [
        { ip: '8.8.8.8', provider: 'Google LLC', asn: 'AS15169' },
      ],
    },
    checks: [],
    stats: {
      total: 10,
      uniqueIPs: 3,
      alive: 3,
      dead: 0,
      subnets: 2,
      providers: 2,
      providerList: { CloudFlare: 2, 'Google LLC': 1 },
    },
  };

  test('содержит рамку с заголовком', () => {
    const output = formatResult(result);
    expect(output).toContain('╔');
    expect(output).toContain('╗');
    expect(output).toContain('╚');
    expect(output).toContain('╝');
    expect(output).toContain('IP SCANNER');
  });

  test('содержит блок статистики', () => {
    const output = formatResult(result);
    expect(output).toContain('STATS');
    expect(output).toContain('Total lines');
    expect(output).toContain('10');
    expect(output).toContain('Unique IPs');
    expect(output).toContain('3');
    expect(output).toContain('Alive');
    expect(output).toContain('Dead');
  });

  test('содержит таблицу провайдеров', () => {
    const output = formatResult(result);
    expect(output).toContain('PROVIDERS');
    expect(output).toContain('CloudFlare');
    expect(output).toContain('Google LLC');
  });

  test('содержит группировку по подсетям', () => {
    const output = formatResult(result);
    expect(output).toContain('SUBNETS');
    expect(output).toContain('1.1.0.0/16');
    expect(output).toContain('8.8.0.0/16');
    expect(output).toContain('1.1.1.1');
    expect(output).toContain('8.8.8.8');
  });

  test('содержит bar-chart для провайдеров', () => {
    const output = formatResult(result);
    // CloudFlare has 2 IPs, should have longer bar
    expect(output).toContain('█');
  });
});
