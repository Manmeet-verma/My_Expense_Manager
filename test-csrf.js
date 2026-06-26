/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const https = require('https');

function makeRequest(hostname, port, path, method, body, protocol = 'http') {
  return new Promise((resolve, reject) => {
    const client = protocol === 'https' ? https : http;
    
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TestClient/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      console.log(`${method} ${path} -> ${res.statusCode}`);
      console.log('Headers:', {
        'set-cookie': res.headers['set-cookie']?.length ? 'present' : 'none',
        'content-length': res.headers['content-length'],
      });
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500)
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function test() {
  console.log('=== NextAuth Credentials Test ===\n');
  
  try {
    // Step 1: Get CSRF token
    console.log('Step 1: Fetching CSRF token from /api/auth/csrf');
    const csrfRes = await makeRequest('localhost', 3000, '/api/auth/csrf', 'GET');
    console.log('Response:', csrfRes.status, csrfRes.body.substring(0, 100), '\n');

    // Step 2: Try credentials endpoint
    console.log('Step 2: Attempting login via /api/auth/callback/credentials');
    const loginBody = new URLSearchParams({
      email: 'admin@example.com',
      password: 'admin123',
      csrfToken: 'test'
    }).toString();

    const loginRes = await makeRequest(
      'localhost',
      3000,
      '/api/auth/callback/credentials',
      'POST',
      loginBody
    );
    console.log('Response:', loginRes.status);
    console.log('Cookies:', loginRes.headers['set-cookie']?.length ? 'received' : 'none');
    console.log('Body sample:', loginRes.body);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
