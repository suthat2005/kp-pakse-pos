import { useState, useEffect } from 'react';

// Fetches the LAN server IP once on mount. Previously this effect was copied
// verbatim into POS and FramingBoard.
export function useServerIp(defaultIp = '127.0.0.1') {
  const [serverIp, setServerIp] = useState(defaultIp);

  useEffect(() => {
    fetch('/api/server-ip')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) {
          setServerIp(data.ip);
        }
      })
      .catch(err => console.error('Error fetching server IP:', err));
  }, []);

  return serverIp;
}
