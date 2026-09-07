import http from 'http';

const req = http.request('http://localhost:3001/api/daily-logs/work-log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.write(JSON.stringify({
  user_id: 1,
  log_date: '2026-09-07',
  work_completed: 'Test log',
  hours_spent: 0,
  status: 'in-progress'
}));
req.end();
