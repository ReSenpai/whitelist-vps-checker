const fs = require('fs');
const path = require('path');
const os = require('os');
const { writeJSON } = require('../src/writer');

describe('writeJSON', () => {
  const tmpDir = os.tmpdir();
  const testFile = path.join(tmpDir, `writer-test-${Date.now()}.json`);

  afterAll(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  test('записывает данные в JSON-файл с отступами', () => {
    const data = { bySubnet: { '1.1.0.0/16': [{ ip: '1.1.1.1' }] } };

    writeJSON(testFile, data);

    const content = fs.readFileSync(testFile, 'utf-8');
    expect(JSON.parse(content)).toEqual(data);
    expect(content).toContain('  '); // pretty-printed
  });
});
