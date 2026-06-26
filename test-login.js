/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

async function testLogin() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': []
    }
  };

  const postData = 'email=admin%40example.com&password=admin123';

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data.substring(0, 200));
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testLogin().catch(console.error);
