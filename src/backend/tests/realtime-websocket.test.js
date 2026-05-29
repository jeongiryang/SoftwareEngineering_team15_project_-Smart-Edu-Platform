const {
  createWebSocketAcceptValue,
  encodeTextFrame,
  readClientFrame
} = require('../src/realtime/websocket.server');

describe('Realtime WebSocket helpers', () => {
  it('creates a valid WebSocket accept value', () => {
    expect(createWebSocketAcceptValue('dGhlIHNhbXBsZSBub25jZQ==')).toBe('s3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
  });

  it('encodes server text frames without masking', () => {
    const frame = encodeTextFrame(JSON.stringify({ type: 'ping' }));

    expect(frame[0]).toBe(0x81);
    expect(frame[1] & 0x80).toBe(0);
  });

  it('decodes masked client frames', () => {
    const payload = Buffer.from('ping');
    const mask = Buffer.from([1, 2, 3, 4]);
    const maskedPayload = Buffer.alloc(payload.length);

    for (let index = 0; index < payload.length; index += 1) {
      maskedPayload[index] = payload[index] ^ mask[index % 4];
    }

    const frame = Buffer.concat([
      Buffer.from([0x81, 0x80 | payload.length]),
      mask,
      maskedPayload
    ]);

    const decoded = readClientFrame(frame);

    expect(decoded.opcode).toBe(0x1);
    expect(decoded.payload.toString('utf8')).toBe('ping');
  });
});
