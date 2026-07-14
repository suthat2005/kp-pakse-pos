import http from 'http';
import { execFile } from 'child_process';
import { URL } from 'url';
import net from 'net';

const PORT = 5173;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/kick-drawer') {
    const printerName = parsedUrl.searchParams.get('printer') || 'GP-L80250 Series';
    res.setHeader('Content-Type', 'application/json');

    // Check if the printer name is a LAN IP address
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(printerName)) {
      console.log('🌐 LAN printer IP detected. Kicking drawer via direct TCP socket on port 9100:', printerName);
      const client = new net.Socket();
      client.setTimeout(3000);
      
      client.connect(9100, printerName, () => {
        const kickCommand = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
        client.write(kickCommand, () => {
          client.destroy();
          console.log('✓ Cash drawer kicked successfully via TCP socket to LAN printer at IP:', printerName);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, method: 'tcp' }));
        });
      });

      client.on('error', (err) => {
        client.destroy();
        console.error('❌ TCP socket drawer kick error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      });

      client.on('timeout', () => {
        client.destroy();
        console.error('❌ TCP socket drawer kick timeout');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: 'Connection timeout' }));
      });
      return;
    }

    // Otherwise fall back to local Windows driver spooler via Powershell
    execFile('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', 'kick-drawer.ps1',
      '-PrinterName', printerName
    ], (err, stdout, stderr) => {
      if (err) {
        console.error('Local printer kick error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err.message }));
      } else {
        console.log('Local printer kick command sent via Powershell:', printerName);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, method: 'powershell' }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`POS Print Helper running on port ${PORT}`);
  console.log(`Allows direct cash drawer kick from live website`);
  console.log(`===================================================`);
});
