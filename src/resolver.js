const http = require('http');

const BATCH_SIZE = 100;

function parseEntry(parsed) {
  if (parsed.status === 'success') {
    const asn = parsed.as ? parsed.as.split(' ')[0] : undefined;
    return { isp: parsed.isp, asn, raw: parsed };
  }
  return { isp: 'unknown', asn: undefined, raw: parsed };
}

function getProvider(ip) {
  return new Promise((resolve) => {
    const url = `http://ip-api.com/json/${ip}`;
    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(parseEntry(JSON.parse(data)));
        } catch {
          resolve({ isp: 'unknown', asn: undefined, raw: { error: 'invalid JSON', body: data } });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ isp: 'unknown', asn: undefined, raw: { error: err.message } });
    });
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('invalid JSON'));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function getProviderBatch(ips) {
  const results = new Map();

  for (let i = 0; i < ips.length; i += BATCH_SIZE) {
    const chunk = ips.slice(i, i + BATCH_SIZE);

    try {
      const responses = await postJSON('http://ip-api.com/batch', chunk);

      for (let j = 0; j < chunk.length; j++) {
        const parsed = responses[j];
        results.set(chunk[j], parseEntry(parsed));
      }
    } catch (err) {
      for (const ip of chunk) {
        results.set(ip, { isp: 'unknown', asn: undefined, raw: { error: err.message } });
      }
    }

    // Rate limit pause between batches (15 batch req/min)
    if (i + BATCH_SIZE < ips.length) {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  return results;
}

module.exports = { getProvider, getProviderBatch };
