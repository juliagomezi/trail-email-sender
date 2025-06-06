import 'dotenv/config';
import crypto from 'crypto';



const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/send';
const API_KEY = process.env.API_KEY;
const HMAC_SECRET = process.env.HMAC_SECRET;

function generateSignature(to, subject, html, secret) {
    if (!secret) return null;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(to + subject + html);
    return hmac.digest('hex');
}

async function testEmailAPI(withSignature = false) {
    console.log('🚀 Testing API endpoint:', API_ENDPOINT);
    console.log(`🔐 Testing ${withSignature ? 'WITH' : 'WITHOUT'} HMAC signature`);

    const testData = {
        to: 'aolle99@gmail.com',
        subject: 'Test Email',
        html: '<p>Este es un correo de prueba desde la API.</p>'
    };

    if (withSignature && HMAC_SECRET) {
        testData.signature = generateSignature(
            testData.to,
            testData.subject,
            testData.html,
            HMAC_SECRET
        );
    }

    try {
        console.log('📤 Sending request with data:', JSON.stringify(testData, null, 2));

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response status text:', response.statusText);

        // Obtener el texto de la respuesta primero
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText.substring(0, 500));

        // Intentar parsear como JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('📄 Parsed JSON response:', result);
        } catch (parseError) {
            console.log('❌ Failed to parse response as JSON');
            console.log('📄 Response text:', responseText);
            return false;
        }

        if (response.ok) {
            console.log('✅ Test passed');
            return true;
        } else {
            console.log('❌ Test failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('❌ Full error:', error);
        return false;
    }
}

// Función para verificar el estado del servidor
async function checkServerHealth() {
    try {
        console.log('🏥 Checking server health...');
        const response = await fetch('http://localhost:3000');
        console.log('🏥 Server response status:', response.status);
        const text = await response.text();
        console.log('🏥 Server response text:', text.substring(0, 200));
    } catch (error) {
        console.log('💀 Server health check failed:', error.message);
    }
}

// Ejecutar tests
async function runTests() {
    console.log('=== EMAIL API TESTS ===\n');

    // Verificar estado del servidor primero
    await checkServerHealth();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test sin firma
    console.log('1. Testing without signature...');
    const test1 = await testEmailAPI(false);

    console.log('\n' + '='.repeat(50) + '\n');

    // Test con firma (si está configurado)
    if (HMAC_SECRET) {
        console.log('2. Testing with signature...');
        const test2 = await testEmailAPI(true);
    } else {
        console.log('2. Skipping signature test (HMAC_SECRET not configured)');
    }
}

runTests();