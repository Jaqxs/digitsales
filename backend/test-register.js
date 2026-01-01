
async function testRegister() {
    const data = {
        email: 'test' + Date.now() + '@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+255123456789'
    };

    console.log('Testing registration with:', data);

    try {
        const response = await fetch('http://localhost:3001/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testRegister();
