const { runPipeline } = require('../src/index');

jest.mock('../src/checker', () => ({
  checkIP: jest.fn().mockResolvedValue({ alive: true, reason: 'connected' }),
}));

jest.mock('../src/resolver', () => ({
  getProviderBatch: jest.fn().mockImplementation((ips) => {
    const providers = {
      '1.1.1.1': { isp: 'CloudFlare', asn: 'AS13335', raw: { status: 'success', isp: 'CloudFlare', as: 'AS13335' } },
      '2.2.2.2': { isp: 'CloudFlare', asn: 'AS13335', raw: { status: 'success', isp: 'CloudFlare', as: 'AS13335' } },
      '3.3.3.3': { isp: 'Google LLC', asn: 'AS15169', raw: { status: 'success', isp: 'Google LLC', as: 'AS15169' } },
    };
    const map = new Map();
    for (const ip of ips) {
      map.set(ip, providers[ip] || { isp: 'unknown', asn: undefined, raw: { status: 'fail' } });
    }
    return Promise.resolve(map);
  }),
}));

describe('runPipeline', () => {
  test('полный пайплайн: парсинг → проверка → резолв → группировка', async () => {
    const input = [
      'vless://abc@1.1.1.1:443?x=1#a',
      'vless://def@2.2.2.2:443?x=1#b',
      'vless://ghi@3.3.3.3:443?x=1#c',
      'vless://jkl@1.1.1.1:8443?x=1#d', // дубликат IP
    ].join('\n');

    const result = await runPipeline(input);

    // Stats
    expect(result.stats.total).toBe(4);
    expect(result.stats.uniqueIPs).toBe(3);
    expect(result.stats.alive).toBe(3);
    expect(result.stats.dead).toBe(0);

    // bySubnet
    expect(result.bySubnet['1.1.0.0/16']).toHaveLength(1);
    expect(result.bySubnet['2.2.0.0/16']).toHaveLength(1);
    expect(result.bySubnet['3.3.0.0/16']).toHaveLength(1);

    // byProvider
    expect(result.byProvider['CloudFlare']).toHaveLength(2);
    expect(result.byProvider['Google LLC']).toHaveLength(1);

    // checks — детальная информация по каждому IP
    expect(result.checks).toHaveLength(3);
    expect(result.checks[0].tcp).toEqual({ port: 80, alive: true, reason: 'connected' });
    expect(result.checks[0].api).toBeDefined();

    // providerList в stats
    expect(result.stats.providerList).toEqual({
      CloudFlare: 2,
      'Google LLC': 1,
    });
  });

  test('помечает недоступные IP', async () => {
    const { checkIP } = require('../src/checker');
    checkIP.mockImplementation((ip) => {
      if (ip === '4.4.4.4') return Promise.resolve({ alive: false, reason: 'timeout' });
      return Promise.resolve({ alive: true, reason: 'connected' });
    });

    const input = [
      'vless://a@4.4.4.4:443?x=1#a',
      'vless://b@5.5.5.5:443?x=1#b',
    ].join('\n');

    const result = await runPipeline(input);

    expect(result.stats.alive).toBe(1);
    expect(result.stats.dead).toBe(1);
    // dead IPs не попадают в группировку
    expect(Object.values(result.bySubnet).flat()).toHaveLength(1);
  });
});
