const { extractIPs } = require('../src/parser');

describe('extractIPs', () => {
  test('извлекает уникальные IP из VLESS-ссылок', () => {
    const input = [
      'vless://abc@1.1.1.1:443?encryption=none#label1',
      'vless://def@1.1.1.1:8443?encryption=none#label2',
      'vless://ghi@2.2.2.2:443?encryption=none#label3',
    ].join('\n');

    expect(extractIPs(input)).toEqual(['1.1.1.1', '2.2.2.2']);
  });

  test('возвращает пустой массив для пустого ввода', () => {
    expect(extractIPs('')).toEqual([]);
  });

  test('игнорирует невалидные строки', () => {
    const input = 'random text\nvless://abc@3.3.3.3:443?x=1#ok\nhello world';
    expect(extractIPs(input)).toEqual(['3.3.3.3']);
  });

  test('работает с реальным форматом VLESS', () => {
    const input =
      'vless://09b81314-7592-4ffb-9773-6351de8a7f74@37.139.34.244:8443?encryption=none&type=grpc&security=reality#label';
    expect(extractIPs(input)).toEqual(['37.139.34.244']);
  });
});
