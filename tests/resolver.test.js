const http = require('http');
const { getProvider, getProviderBatch } = require('../src/resolver');

jest.mock('http');

describe('getProvider', () => {
  test('возвращает ISP и ASN при успешном ответе', async () => {
    const mockResponse = {
      on: jest.fn(),
      statusCode: 200,
    };

    mockResponse.on.mockImplementation((event, cb) => {
      if (event === 'data') process.nextTick(() => cb(JSON.stringify({
        status: 'success',
        isp: 'Google LLC',
        as: 'AS15169 Google LLC',
      })));
      if (event === 'end') process.nextTick(cb);
      return mockResponse;
    });

    http.get.mockImplementation((url, cb) => {
      process.nextTick(() => cb(mockResponse));
      return { on: jest.fn() };
    });

    const result = await getProvider('8.8.8.8');
    expect(result.isp).toBe('Google LLC');
    expect(result.asn).toBe('AS15169');
    expect(result.raw).toEqual({
      status: 'success',
      isp: 'Google LLC',
      as: 'AS15169 Google LLC',
    });
  });

  test('возвращает unknown при ошибке запроса', async () => {
    http.get.mockImplementation((url, cb) => {
      const req = { on: jest.fn() };
      req.on.mockImplementation((event, errCb) => {
        if (event === 'error') process.nextTick(() => errCb(new Error('ECONNREFUSED')));
        return req;
      });
      return req;
    });

    const result = await getProvider('0.0.0.0');
    expect(result.isp).toBe('unknown');
    expect(result.asn).toBeUndefined();
    expect(result.raw).toEqual({ error: 'ECONNREFUSED' });
  });

  test('возвращает unknown при fail-статусе API', async () => {
    const mockResponse = {
      on: jest.fn(),
      statusCode: 200,
    };

    mockResponse.on.mockImplementation((event, cb) => {
      if (event === 'data') process.nextTick(() => cb(JSON.stringify({
        status: 'fail',
        message: 'reserved range',
      })));
      if (event === 'end') process.nextTick(cb);
      return mockResponse;
    });

    http.get.mockImplementation((url, cb) => {
      process.nextTick(() => cb(mockResponse));
      return { on: jest.fn() };
    });

    const result = await getProvider('192.168.1.1');
    expect(result.isp).toBe('unknown');
    expect(result.asn).toBeUndefined();
    expect(result.raw).toEqual({
      status: 'fail',
      message: 'reserved range',
    });
  });
});

describe('getProviderBatch', () => {
  test('резолвит массив IP одним batch-запросом', async () => {
    const batchResponse = [
      { status: 'success', query: '1.1.1.1', isp: 'CloudFlare', as: 'AS13335 CloudFlare' },
      { status: 'success', query: '8.8.8.8', isp: 'Google LLC', as: 'AS15169 Google LLC' },
    ];

    const mockRes = { on: jest.fn() };
    mockRes.on.mockImplementation((event, cb) => {
      if (event === 'data') process.nextTick(() => cb(JSON.stringify(batchResponse)));
      if (event === 'end') process.nextTick(cb);
      return mockRes;
    });

    const mockReq = { on: jest.fn(), write: jest.fn(), end: jest.fn() };
    mockReq.on.mockReturnValue(mockReq);
    http.request.mockImplementation((opts, cb) => {
      process.nextTick(() => cb(mockRes));
      return mockReq;
    });

    const results = await getProviderBatch(['1.1.1.1', '8.8.8.8']);

    expect(results.get('1.1.1.1')).toMatchObject({ isp: 'CloudFlare', asn: 'AS13335' });
    expect(results.get('8.8.8.8')).toMatchObject({ isp: 'Google LLC', asn: 'AS15169' });
    expect(results.size).toBe(2);
  });

  test('возвращает unknown при ошибке batch-запроса', async () => {
    const mockReq = { on: jest.fn(), write: jest.fn(), end: jest.fn() };
    mockReq.on.mockImplementation((event, cb) => {
      if (event === 'error') process.nextTick(() => cb(new Error('ECONNREFUSED')));
      return mockReq;
    });
    http.request.mockReturnValue(mockReq);

    const results = await getProviderBatch(['1.1.1.1']);

    expect(results.get('1.1.1.1')).toMatchObject({ isp: 'unknown' });
  });
});
