/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

async function getCSRFToken() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/auth/csrf', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.csrfToken);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function loginWithHeader(csrfToken) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123',
      csrfToken: csrfToken,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signin/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Content-Length': payload.length,
      },
      redirect: 'manual'
    };

    const req = http.request(options, (res) => {
      let data = '';
      console.log(`POST with CSRF header -> ${res.statusCode}`);
      console.log('Redirect:', res.headers.location);
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test() {
  try {
    const token = await getCSRFToken();
    console.log(`Got CSRF token: ${token.substring(0, 20)}...\n`);
    
    console.log('Test 1: JSON with csrfToken in body and X-CSRF-Token header');
    const result = await loginWithHeader(token);
    console.log('Result:', result);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
