#!/usr/bin/env tsx
/**
 * Test the actual HTTP /api/meals/approve endpoint
 */

async function testApproveHTTP() {
  console.log('🧪 Testing /api/meals/approve via HTTP...\n');

  try {
    // Step 1: Login to get session cookie
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@foodtracker.local',
        password: 'password123'
      })
    });

    console.log('Login status:', loginRes.status);
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Cookies:', cookies?.substring(0, 100) + '...\n');

    // Step 2: Prepare approve payload
    console.log('2️⃣ Preparing approve payload...');
    const payload = {
      meal_type: 'lunch',
      consumed_at: new Date().toISOString(),
      notes: 'Test from HTTP script',
      foods: [
        {
          name: 'Arroz',
          quantity: 100,
          unit: 'g',
          calories: 130,
          protein_g: 2.7,
          carbs_g: 28,
          fat_g: 0.3
        },
        {
          name: 'Feijão',
          quantity: 80,
          unit: 'g',
          calories: 77,
          protein_g: 4.5,
          carbs_g: 14,
          fat_g: 0.5
        }
      ]
    };

    // Step 3: Call approve endpoint
    console.log('3️⃣ Calling /api/meals/approve...\n');
    const approveRes = await fetch('http://localhost:3001/api/meals/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(payload)
    });

    console.log('Approve response status:', approveRes.status);
    const result = await approveRes.json();
    console.log('\n📊 Response:');
    console.log(JSON.stringify(result, null, 2));

    if (approveRes.ok && result.ok) {
      console.log('\n✅ SUCCESS! Meal created with ID:', result.id);
    } else {
      console.log('\n❌ FAILED!');
      if (result.error === 'new row violates row-level security policy') {
        console.log('\n🚨 THE RLS ERROR IS STILL HAPPENING!');
        console.log('Diagnostics:', JSON.stringify(result.diagnostics, null, 2));
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testApproveHTTP();
