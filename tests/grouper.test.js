const { groupBySubnet, groupByProvider } = require('../src/grouper');

describe('groupBySubnet', () => {
  test('группирует записи по подсети /16', () => {
    const entries = [
      { ip: '37.139.34.244', provider: 'VK' },
      { ip: '37.139.32.63', provider: 'VK' },
      { ip: '95.163.182.221', provider: 'MTS' },
    ];

    expect(groupBySubnet(entries)).toEqual({
      '37.139.0.0/16': [
        { ip: '37.139.34.244', provider: 'VK' },
        { ip: '37.139.32.63', provider: 'VK' },
      ],
      '95.163.0.0/16': [
        { ip: '95.163.182.221', provider: 'MTS' },
      ],
    });
  });

  test('возвращает пустой объект для пустого массива', () => {
    expect(groupBySubnet([])).toEqual({});
  });
});

describe('groupByProvider', () => {
  test('группирует записи по провайдеру', () => {
    const entries = [
      { ip: '1.1.1.1', provider: 'CloudFlare' },
      { ip: '2.2.2.2', provider: 'Google' },
      { ip: '3.3.3.3', provider: 'CloudFlare' },
    ];

    expect(groupByProvider(entries)).toEqual({
      CloudFlare: [
        { ip: '1.1.1.1', provider: 'CloudFlare' },
        { ip: '3.3.3.3', provider: 'CloudFlare' },
      ],
      Google: [
        { ip: '2.2.2.2', provider: 'Google' },
      ],
    });
  });

  test('возвращает пустой объект для пустого массива', () => {
    expect(groupByProvider([])).toEqual({});
  });
});
