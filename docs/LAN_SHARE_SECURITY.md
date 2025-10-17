# LAN Share Security Guide

## Overview

The LAN Share module (`src/main/modules/lanShare.ts`) is designed for **trusted network environments** such as home networks or small office LANs. It provides convenient peer-to-peer file sharing without requiring complex setup or authentication infrastructure.

**Default Security Posture**: Optimized for ease of use on trusted networks

## How It Works

### Discovery Protocol

- Uses UDP broadcast on port 49372
- Peers announce themselves and respond to discovery requests
- No authentication required for discovery

### Transfer Protocol

- Uses HTTP server on random high port
- Offer/accept workflow for user consent
- Temporary tokens for uploads
- Files are transferred as compressed zip archives

## Security Considerations for Trusted Networks

### ✅ Safe in Trusted Environments

The module is safe to use when:

- Connected to home WiFi networks
- On small office/corporate LANs with trusted users
- Behind NAT routers (not directly exposed to internet)
- Firewall is configured to block external access to discovery port

### ⚠️ Important Limitations

**No Built-in Authentication**: The module does not implement:

- User authentication
- Password protection
- Encrypted transfers
- Access control lists
- Rate limiting
- Request signing

**User Consent Required**: The receiver must manually accept each transfer, which provides a baseline level of control.

## Optional Security Hardening

If you need to deploy this in less trusted environments, consider implementing:

### 1. Authentication Layer

Add token-based authentication to HTTP endpoints:

```typescript
// In lanShare.ts, modify createHttpServer()
const validTokens = new Set<string>();

// Generate tokens on app start or user login
function generateAuthToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);
  return token;
}

// Validate all incoming requests
function validateAuthHeader(req: http.IncomingMessage): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return validTokens.has(token);
}

// Add to each endpoint
if (!validateAuthHeader(req)) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
  return;
}
```

### 2. Encryption (TLS/HTTPS)

Replace HTTP server with HTTPS:

```typescript
import https from 'https';

// Generate self-signed certificates or use Let's Encrypt
const httpsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
};

httpServer = https.createServer(httpsOptions, async (req, res) => {
  // ... existing handler code
});
```

**Note**: Self-signed certificates will require peer validation handling.

### 3. Network Filtering

Restrict to specific network interfaces:

```typescript
// Only listen on private network interfaces
function listPrivateAddresses(): string[] {
  const ifs = os.networkInterfaces();
  const out: string[] = [];
  for (const key of Object.keys(ifs)) {
    for (const addr of ifs[key] || []) {
      if (!addr.internal && addr.family === 'IPv4') {
        // Filter to private IP ranges
        const ip = addr.address;
        if (
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          (ip.startsWith('172.') && 
           parseInt(ip.split('.')[1]) >= 16 && 
           parseInt(ip.split('.')[1]) <= 31)
        ) {
          out.push(ip);
        }
      }
    }
  }
  return out;
}

// Bind HTTP server to specific interface
httpServer.listen(0, preferredLocalIP, () => {
  // ...
});
```

### 4. Rate Limiting

Prevent abuse with request rate limiting:

```typescript
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// In HTTP handler
const clientIP = req.socket.remoteAddress || '';
if (!checkRateLimit(clientIP)) {
  res.writeHead(429, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }));
  return;
}
```

### 5. File Size Limits

Prevent disk space exhaustion:

```typescript
const MAX_TRANSFER_SIZE = 500 * 1024 * 1024; // 500 MB

// In offer endpoint
if (body.approxSize && body.approxSize > MAX_TRANSFER_SIZE) {
  res.writeHead(413, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'File too large' }));
  return;
}

// In upload endpoint
const contentLen = parseInt(String(req.headers['content-length'] || '0'), 10);
if (contentLen > MAX_TRANSFER_SIZE) {
  res.writeHead(413, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'File too large' }));
  return;
}
```

### 6. Path Traversal Protection

Ensure extracted files don't escape destination:

```typescript
import path from 'path';

function validateExtractPath(extractPath: string, baseDir: string): boolean {
  const normalized = path.normalize(extractPath);
  const relative = path.relative(baseDir, normalized);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

// When extracting ZIP
const zip = new StreamZip.async({ file: tmpZip });
const entries = await zip.entries();
for (const entry of Object.values(entries)) {
  const fullPath = path.join(pending.destDir, entry.name);
  if (!validateExtractPath(fullPath, pending.destDir)) {
    throw new Error('Invalid archive: path traversal detected');
  }
}
```

### 7. Content Type Validation

Validate uploaded files match expected types:

```typescript
import { fileTypeFromBuffer } from 'file-type';

async function validateFileType(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer);
  if (!type) return false;
  
  // Only allow specific MIME types
  const allowedTypes = [
    'application/zip',
    'application/x-zip-compressed',
  ];
  
  return allowedTypes.includes(type.mime);
}

// Check first chunk of upload
let firstChunk = true;
req.on('data', async (chunk: any) => {
  if (firstChunk) {
    firstChunk = false;
    const valid = await validateFileType(chunk);
    if (!valid) {
      req.destroy();
      return;
    }
  }
  // ... rest of handling
});
```

## Firewall Configuration

### Windows Firewall

```powershell
# Allow inbound on UDP port 49372 for discovery
New-NetFirewallRule -DisplayName "LAN Share Discovery" -Direction Inbound -Protocol UDP -LocalPort 49372 -Action Allow -Profile Private

# Allow inbound HTTP (random port, so allow the app)
New-NetFirewallRule -DisplayName "LAN Share HTTP" -Direction Inbound -Program "C:\Path\To\YourApp.exe" -Action Allow -Profile Private
```

### macOS Firewall

```bash
# Add app to firewall allowed list
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/YourApp.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /Applications/YourApp.app
```

### Linux (ufw)

```bash
# Allow UDP discovery
sudo ufw allow 49372/udp

# Allow app
sudo ufw allow from 192.168.0.0/16 to any
```

## Network Isolation

### Recommended Network Topology

```
Internet
   |
[Router/NAT] ← Blocks external access to LAN Share ports
   |
[Switch]
   |
├─ Trusted Device 1 (LAN Share enabled)
├─ Trusted Device 2 (LAN Share enabled)
└─ Trusted Device 3 (LAN Share enabled)
```

### VLAN Segmentation (Advanced)

For corporate environments, consider VLANs:

- Place LAN Share users on dedicated VLAN
- Block inter-VLAN routing except for specific services
- Monitor traffic for anomalies

## Monitoring & Logging

Add logging for security auditing:

```typescript
import log from 'electron-log';

// Log all transfer attempts
log.info('[LAN Share] Transfer offer from:', body.sender.hostname);
log.info('[LAN Share] Transfer accepted:', { 
  peer: body.sender.hostname, 
  size: body.approxSize 
});

// Log all errors
log.error('[LAN Share] Transfer failed:', error);
```

## User Education

Inform users about safe practices:

1. **Only use on trusted networks** - Home WiFi, office LANs
2. **Review offers before accepting** - Check sender name and project name
3. **Disable when on public WiFi** - Coffee shops, airports, etc.
4. **Check received files** - Scan with antivirus if suspicious

## Future Enhancements

Consider these features for production use:

- [ ] Opt-in/opt-out toggle in settings
- [ ] Whitelist of trusted peers by hostname or ID
- [ ] Transfer history and audit log
- [ ] Virus scanning integration
- [ ] User notifications for completed transfers
- [ ] Bandwidth throttling options

## Conclusion

The LAN Share module prioritizes ease of use for trusted environments. If deploying in production or less trusted networks, implement the hardening measures appropriate for your security requirements.

**Remember**: Security is a spectrum. Evaluate your threat model and implement protections accordingly.

---

**Questions or Concerns?**
Open an issue on the project repository or consult with a security professional for your specific deployment scenario.
