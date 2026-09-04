import fetch from 'node-fetch';

async function testSubmit() {
  try {
    const res = await fetch('http://localhost:3001/api/employee/tasks/1/submit-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        completion_comment: 'test',
        reviewer_id: 2,
        task_owner_id: 1
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
}

testSubmit();
