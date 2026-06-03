const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Jackson@2024',
    database: 'digisales_pos'
  });

  try {
    await client.connect();

    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@digisales.co.tz']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    await client.query(`
      INSERT INTO users (id, email, "passwordHash", role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [userId, 'admin@digisales.co.tz', hashedPassword, 'admin', true]);

    // Create user profile
    await client.query(`
      INSERT INTO user_profiles ("userId", "firstName", "lastName")
      VALUES ($1, $2, $3)
    `, [userId, 'Admin', 'User']);

    console.log('Admin user created successfully!');
    console.log('Email: admin@digisales.co.tz');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();
