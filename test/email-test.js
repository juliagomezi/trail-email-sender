
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/send';
const API_KEY = process.env.API_KEY;
const HMAC_SECRET = process.env.HMAC_SECRET;

function generateSignature(to, subject, html, secret) {
    if (!secret) return null;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(to + subject + html);
    return hmac.digest('hex');
}

// Función para crear un archivo de prueba
function createTestFile(filename, content) {
    try {
        fs.writeFileSync(filename, content);
        return true;
    } catch (error) {
        console.log(`❌ Error creating test file: ${error.message}`);
        return false;
    }
}

// Función para limpiar archivos de prueba
function cleanupTestFiles(files) {
    files.forEach(file => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            console.log(`Warning: Could not delete ${file}`);
        }
    });
}

// Función para crear attachments de prueba
function createTestAttachments() {
    const attachments = [];
    const testFiles = [];

    try {
        // Crear un archivo de texto pequeño
        const textFile = 'test-document.txt';
        const textContent = 'Este es un documento de prueba para testing de attachments.\nContiene texto en múltiples líneas.\n¡Correbars 2025!';

        if (createTestFile(textFile, textContent)) {
            testFiles.push(textFile);
            const textBuffer = fs.readFileSync(textFile);
            attachments.push({
                filename: 'documento-prueba.txt',
                content: textBuffer.toString('base64'),
                contentType: 'text/plain'
            });
        }

        // Crear un archivo JSON pequeño
        const jsonFile = 'test-data.json';
        const jsonContent = JSON.stringify({
            evento: 'Correbars 2025',
            fecha: new Date().toISOString(),
            participantes: ['Test User 1', 'Test User 2'],
            precios: { base: 25, bocadillo: 3 }
        }, null, 2);

        if (createTestFile(jsonFile, jsonContent)) {
            testFiles.push(jsonFile);
            const jsonBuffer = fs.readFileSync(jsonFile);
            attachments.push({
                filename: 'datos-evento.json',
                content: jsonBuffer.toString('base64'),
                contentType: 'application/json'
            });
        }

        // Crear un archivo CSV pequeño
        const csvFile = 'test-registro.csv';
        const csvContent = 'Nombre,Email,Talla,Precio\nJuan Pérez,juan@test.com,M,28€\nMaría García,maria@test.com,S,25€';

        if (createTestFile(csvFile, csvContent)) {
            testFiles.push(csvFile);
            const csvBuffer = fs.readFileSync(csvFile);
            attachments.push({
                filename: 'registro-participantes.csv',
                content: csvBuffer.toString('base64'),
                contentType: 'text/csv'
            });
        }

        return { attachments, testFiles };
    } catch (error) {
        console.log(`❌ Error creating test attachments: ${error.message}`);
        cleanupTestFiles(testFiles);
        return { attachments: [], testFiles: [] };
    }
}

async function testEmailAPI(testType = 'basic') {
    console.log('🚀 Testing API endpoint:', API_ENDPOINT);
    console.log(`🔧 Test type: ${testType.toUpperCase()}`);

    let testData = {
        to: 'aolle99@gmail.com',
        subject: '',
        html: ''
    };

    let testFiles = [];

    // Configurar datos según el tipo de test
    switch (testType) {
        case 'basic':
            testData.subject = 'Test Email - Basic';
            testData.html = '<h1>🍻 Test Email Correbars 2025</h1><p>Este es un correo de prueba desde la API.</p><p>Contenido con <strong>HTML</strong> y <em>formato</em>.</p>';
            break;

        case 'with-signature':
            testData.subject = 'Test Email - With HMAC Signature';
            testData.html = '<h1>🔐 Test con Firma HMAC</h1><p>Este correo incluye validación de firma HMAC.</p>';
            if (HMAC_SECRET) {
                testData.signature = generateSignature(
                    testData.to,
                    testData.subject,
                    testData.html,
                    HMAC_SECRET
                );
            }
            break;

        case 'with-attachments':
            testData.subject = 'Test Email - With Attachments 📎';
            testData.html = `
                <h1>🍻 Correbars 2025 - Test con Adjuntos</h1>
                <p>Este correo incluye varios archivos adjuntos para probar la funcionalidad:</p>
                <ul>
                    <li>📄 Documento de texto</li>
                    <li>📊 Datos en formato JSON</li>
                    <li>📈 Registro en CSV</li>
                </ul>
                <p>Por favor, verifica que todos los adjuntos se reciban correctamente.</p>
                <hr>
                <p><small>Email enviado por el sistema de testing de Correbars API</small></p>
            `;

            const { attachments, testFiles: files } = createTestAttachments();
            testData.attachments = attachments;
            testFiles = files;

            if (HMAC_SECRET) {
                testData.signature = generateSignature(
                    testData.to,
                    testData.subject,
                    testData.html,
                    HMAC_SECRET
                );
            }
            break;

        case 'anti-spam':
            testData.subject = 'Correbars 2025 - Entrada Confirmada ✅';
            testData.html = `
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Confirmación Correbars 2025</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #d4af37;">🍻 Correbars Esparreguera 2025</h1>
                        
                        <p>Estimado/a participante,</p>
                        
                        <p>Te confirmamos tu inscripción en el evento Correbars 2025. Aquí tienes los detalles:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="background-color: #f9f9f9;">
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Número de entrada:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">#TEST-001</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha del evento:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">Por confirmar</td>
                            </tr>
                            <tr style="background-color: #f9f9f9;">
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Precio:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">25€</td>
                            </tr>
                        </table>
                        
                        <p>Este es un email de prueba para verificar la entregabilidad y evitar filtros de spam.</p>
                        
                        <p>Si tienes alguna pregunta, puedes contactarnos respondiendo a este correo.</p>
                        
                        <p>¡Nos vemos en Correbars 2025!</p>
                        
                        <hr style="margin: 30px 0;">
                        <p style="font-size: 12px; color: #666;">
                            Organización Correbars Esparreguera<br>
                            Este es un email automático, pero puedes responder si necesitas ayuda.<br>
                            Si no quieres recibir más emails, <a href="mailto:${process.env.OVH_USER}?subject=Unsubscribe">haz clic aquí</a>.
                        </p>
                    </div>
                </body>
                </html>
            `;

            if (HMAC_SECRET) {
                testData.signature = generateSignature(
                    testData.to,
                    testData.subject,
                    testData.html,
                    HMAC_SECRET
                );
            }
            break;

        case 'large-attachments':
            testData.subject = 'Test Email - Large Attachments';
            testData.html = '<h1>Test con adjuntos grandes</h1><p>Probando límites de tamaño.</p>';

            // Crear un archivo más grande para probar límites
            const largeContent = 'A'.repeat(1024 * 1024); // 1MB de texto
            const largeFile = 'large-test.txt';

            if (createTestFile(largeFile, largeContent)) {
                testFiles.push(largeFile);
                const largeBuffer = fs.readFileSync(largeFile);
                testData.attachments = [{
                    filename: 'archivo-grande.txt',
                    content: largeBuffer.toString('base64'),
                    contentType: 'text/plain'
                }];
            }
            break;
    }

    try {
        console.log('📤 Sending request...');
        console.log(`📧 To: ${testData.to}`);
        console.log(`📝 Subject: ${testData.subject}`);
        console.log(`📎 Attachments: ${testData.attachments ? testData.attachments.length : 0}`);
        console.log(`🔐 Has signature: ${!!testData.signature}`);

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

        const responseText = await response.text();
        console.log('📄 Raw response:', responseText.substring(0, 500));

        let result;
        try {
            result = JSON.parse(responseText);
            console.log('📄 Parsed JSON response:', result);

            if (result.attachmentCount !== undefined) {
                console.log(`📎 Attachments processed: ${result.attachmentCount}`);
            }
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
    } finally {
        // Limpiar archivos de prueba
        if (testFiles.length > 0) {
            console.log('🧹 Cleaning up test files...');
            cleanupTestFiles(testFiles);
        }
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

// Test de validación de attachments inválidos
async function testInvalidAttachments() {
    console.log('🧪 Testing invalid attachments validation...');

    const invalidTestData = {
        to: 'aolle99@gmail.com',
        subject: 'Test Invalid Attachments',
        html: '<p>Testing validation</p>',
        attachments: [
            {
                // Falta filename
                content: 'dGVzdA==',
                contentType: 'text/plain'
            }
        ]
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(invalidTestData)
        });

        const result = await response.json();

        if (response.status === 400 || response.status === 500) {
            console.log('✅ Invalid attachment validation working correctly');
            console.log('📄 Error message:', result.error);
            return true;
        } else {
            console.log('❌ Invalid attachment validation failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Test error:', error.message);
        return false;
    }
}

// Ejecutar todos los tests
async function runTests() {
    console.log('=== EMAIL API COMPREHENSIVE TESTS ===\n');

    // Verificar estado del servidor primero
    await checkServerHealth();
    console.log('\n' + '='.repeat(60) + '\n');

    const tests = [
        { name: 'Basic Email', type: 'basic' },
        { name: 'Email with HMAC Signature', type: 'with-signature', condition: !!HMAC_SECRET },
        { name: 'Email with Attachments', type: 'with-attachments' },
        { name: 'Anti-Spam Optimized Email', type: 'anti-spam' },
        { name: 'Large Attachments Test', type: 'large-attachments' }
    ];

    const results = [];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];

        if (test.condition === false) {
            console.log(`${i + 1}. Skipping ${test.name} (HMAC_SECRET not configured)`);
            continue;
        }

        console.log(`${i + 1}. Testing ${test.name}...`);
        const result = await testEmailAPI(test.type);
        results.push({ name: test.name, passed: result });

        console.log('\n' + '='.repeat(60) + '\n');

        // Pausa entre tests para evitar rate limiting
        if (i < tests.length - 1) {
            console.log('⏸️  Pausing 2 seconds between tests...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Test adicional de validación
    console.log('6. Testing invalid attachments validation...');
    const invalidTest = await testInvalidAttachments();
    results.push({ name: 'Invalid Attachments Validation', passed: invalidTest });

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    let passedCount = 0;
    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`${index + 1}. ${result.name}: ${status}`);
        if (result.passed) passedCount++;
    });

    console.log('='.repeat(60));
    console.log(`📈 Total: ${passedCount}/${results.length} tests passed`);

    if (passedCount === results.length) {
        console.log('🎉 All tests passed! API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the logs above.');
    }
}

// Función para probar solo un tipo específico
async function runSingleTest(testType) {
    console.log(`=== SINGLE TEST: ${testType.toUpperCase()} ===\n`);

    await checkServerHealth();
    console.log('\n' + '='.repeat(50) + '\n');

    const result = await testEmailAPI(testType);

    console.log('\n' + '='.repeat(50));
    console.log(`Test result: ${result ? '✅ PASSED' : '❌ FAILED'}`);
}

// Permitir ejecutar test específico desde línea de comandos
const testType = process.argv[2];
if (testType) {
    runSingleTest(testType);
} else {
    runTests();
}