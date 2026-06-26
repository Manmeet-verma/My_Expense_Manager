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

async function login(csrfToken) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      email: 'admin@example.com',
      password: 'admin123',
      csrfToken: csrfToken,
      json: 'true'
    }).toString();

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
      },
      redirect: 'manual'
    };

    const req = http.request(options, (res) => {
      let data = '';
      console.log(`POST /api/auth/callback/credentials -> ${res.statusCode}`);
      console.log('Location header:', res.headers.location);
      console.log('Set-Cookie:', res.headers['set-cookie']?.join('; '));
      
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
    req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    console.log('Getting CSRF token...');
    const token = await getCSRFToken();
    console.log(`Got token: ${token.substring(0, 20)}...\n`);
    
    console.log('Attempting login with admin@example.com / admin123...');
    const result = await login(token);
    
    console.log('\nResult:');
    console.log('Status:', result.status);
    console.log('Redirect to:', result.location);
    console.log('Body:', result.body.substring(0, 200));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
