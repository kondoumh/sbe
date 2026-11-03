// Fetches an external URL while blocking SSRF (CWE-918): the resolved
// destination address is validated before connecting and pinned for the
// actual connection (to avoid DNS-rebinding TOCTOU), and redirect targets
// are re-validated the same way.
import dns from 'node:dns';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function isPrivateIPv4(ip) {
  const [a, b, c] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // IETF protocol / TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  const firstGroup = normalized.split(':')[0];
  if (/^f[cd][0-9a-f]{2}$/.test(firstGroup)) return true; // fc00::/7 unique local
  if (/^fe[89ab][0-9a-f]$/.test(firstGroup)) return true; // fe80::/10 link-local
  return false;
}

function isBlockedAddress(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unknown address shape, fail closed
}

function resolveSafe(hostname) {
  return new Promise((resolve, reject) => {
    if (net.isIP(hostname)) {
      if (isBlockedAddress(hostname)) {
        reject(new Error(`blocked address: ${hostname}`));
        return;
      }
      resolve({ address: hostname, family: net.isIPv6(hostname) ? 6 : 4 });
      return;
    }
    dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) {
        reject(err);
        return;
      }
      if (addresses.length === 0) {
        reject(new Error(`could not resolve host: ${hostname}`));
        return;
      }
      const blocked = addresses.find(a => isBlockedAddress(a.address));
      if (blocked) {
        reject(new Error(`blocked address: ${blocked.address}`));
        return;
      }
      resolve(addresses[0]);
    });
  });
}

function fetchOnce(targetUrl) {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return Promise.reject(new Error(`unsupported protocol: ${parsed.protocol}`));
  }
  const client = parsed.protocol === 'https:' ? https : http;
  return resolveSafe(parsed.hostname).then(resolved => new Promise((resolve, reject) => {
    const req = client.request(parsed, {
      method: 'GET',
      timeout: REQUEST_TIMEOUT_MS,
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, [{ address: resolved.address, family: resolved.family }]);
        } else {
          callback(null, resolved.address, resolved.family);
        }
      }
    }, res => {
      const chunks = [];
      let received = 0;
      res.on('data', chunk => {
        received += chunk.length;
        if (received > MAX_BODY_BYTES) {
          req.destroy(new Error('response too large'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8')
        });
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('request timed out')));
    req.on('error', reject);
    req.end();
  }));
}

export async function safeFetch(url, maxRedirects = MAX_REDIRECTS) {
  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetchOnce(current);
    if (REDIRECT_STATUSES.has(res.status) && res.headers.location) {
      current = new URL(res.headers.location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}
