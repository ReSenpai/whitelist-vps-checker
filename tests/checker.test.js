const net = require('net');
const { checkIP } = require('../src/checker');

jest.mock('net');

describe('checkIP', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      setTimeout: jest.fn(),
      destroy: jest.fn(),
    };
    net.createConnection.mockReturnValue(mockSocket);
  });

  test('возвращает true при успешном соединении', async () => {
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'connect') process.nextTick(cb);
      return mockSocket;
    });

    const result = await checkIP('1.1.1.1', 80, 1000);
    expect(result).toEqual({ alive: true, reason: 'connected' });
    expect(mockSocket.destroy).toHaveBeenCalled();
  });

  test('возвращает false при таймауте', async () => {
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'timeout') process.nextTick(cb);
      return mockSocket;
    });

    const result = await checkIP('1.1.1.1', 80, 1000);
    expect(result).toEqual({ alive: false, reason: 'timeout' });
    expect(mockSocket.destroy).toHaveBeenCalled();
  });

  test('возвращает false при ошибке соединения', async () => {
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'error') process.nextTick(() => cb(new Error('ECONNREFUSED')));
      return mockSocket;
    });

    const result = await checkIP('1.1.1.1', 80, 1000);
    expect(result).toEqual({ alive: false, reason: 'ECONNREFUSED' });
    expect(mockSocket.destroy).toHaveBeenCalled();
  });
});
