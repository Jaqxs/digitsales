// Using native global fetch in Node.js

async function runApiTest() {
  console.log('🤖 Starting Backend API Integration Test...');
  const baseUrl = 'http://localhost:3001/api/v1';

  try {
    // 1. Test Health Check
    console.log('\n🏥 Testing Health Check...');
    const healthRes = await fetch('http://localhost:3001/health');
    const healthData = await healthRes.json();
    console.log('✅ Health check response:', healthData);

    // 2. Test Login
    console.log('\n🔒 Testing Login API with seeded credentials...');
    const loginPayload = {
      email: 'admin@digisales.co.tz',
      password: 'admin123'
    };
    
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${loginData.error?.message || loginData.message || loginRes.statusText}`);
    }

    console.log('✅ Login successful!');
    console.log(`👤 User Role: ${loginData.data.user.role}`);
    console.log(`🔑 Access Token: ${loginData.data.tokens.accessToken.substring(0, 20)}...`);
    const token = loginData.data.tokens.accessToken;

    // 3. Test GET Products
    console.log('\n📦 Testing GET /products (Authorized)...');
    const productsRes = await fetch(`${baseUrl}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const productsData = await productsRes.json();
    if (!productsRes.ok || !productsData.success) {
      throw new Error(`Fetch products failed: ${productsData.error?.message || productsData.message || productsRes.statusText}`);
    }

    console.log('✅ Products retrieved successfully!');
    const productsList = productsData.data.products || [];
    console.log(`📊 Number of Products: ${productsList.length}`);
    productsList.forEach((prod: any, idx: number) => {
      console.log(`   [${idx + 1}] SKU: ${prod.sku} | Name: ${prod.name} | Price: ${prod.sellingPrice} | Stock: ${prod.currentStock}`);
    });

    // 4. Test GET Customers
    console.log('\n👥 Testing GET /customers (Authorized)...');
    const customersRes = await fetch(`${baseUrl}/customers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const customersData = await customersRes.json();
    if (!customersRes.ok || !customersData.success) {
      throw new Error(`Fetch customers failed: ${customersData.error?.message || customersData.message || customersRes.statusText}`);
    }

    console.log('✅ Customers retrieved successfully!');
    const customersList = customersData.data.customers || [];
    console.log(`📊 Number of Customers: ${customersList.length}`);
    customersList.forEach((cust: any, idx: number) => {
      console.log(`   [${idx + 1}] Name: ${cust.firstName} ${cust.lastName} | Phone: ${cust.phone} | Email: ${cust.email}`);
    });

    console.log('\n🚀 ALL END-TO-END API TESTS PASSED SUCCESSFULLY! The real-time backend is fully active and working.');

  } catch (error: any) {
    console.error('\n❌ API integration test failed:', error.message || error);
    process.exit(1);
  }
}

runApiTest();
