import http from 'http';

const req = http.request('http://localhost:3001/api/tasks/employee/1', {
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Response:', data));
});
req.end();
