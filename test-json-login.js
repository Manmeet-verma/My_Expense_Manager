/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

async function login() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123',
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signin/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
      redirect: 'manual'
    };

    const req = http.request(options, (res) => {
      let data = '';
      console.log(`POST /api/auth/signin/credentials -> ${res.statusCode}`);
      console.log('Location header:', res.headers.location);
      console.log('Set-Cookie:', res.headers['set-cookie']?.join('; '));
      console.log('Content-Type:', res.headers['content-type']);
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          location: res.headers.location,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test() {
  try {
    console.log('Attempting login via JSON to /api/auth/signin/credentials...\n');
    const result = await login();
    
    console.log('\nResult:');
    console.log('Status:', result.status);
    console.log('Redirect to:', result.location);
    console.log('Body:', result.body.substring(0, 300));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
