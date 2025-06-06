import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';


// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para sanitizar HTML básico
function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

const API_KEY = process.env.API_KEY;
const OVH_USER = process.env.OVH_USER;
const OVH_PASS = process.env.OVH_PASS;
const HMAC_SECRET = process.env.HMAC_SECRET;

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

export default async function handler(req, res) {
    try {
        // Configurar headers CORS y de respuesta
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

        if (req.method === 'OPTIONS') {
            return res.status(200).json({ ok: true });
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Verificar variables de entorno críticas
        if (!API_KEY || !OVH_USER || !OVH_PASS) {
            console.error('Missing environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const incomingKey = req.headers['x-api-key'];
        if (!incomingKey || incomingKey !== API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Rate limiting
        await new Promise((resolve, reject) => {
            limiter(req, res, (err) => err ? reject(err) : resolve());
        });

        let body;
        try {
            body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
        } catch (e) {
            console.error('JSON parse error:', e);
            return res.status(400).json({ error: 'Invalid JSON format' });
        }

        const { to, subject, html, signature } = body;

        // Validaciones
        if (!to || !subject || !html) {
            return res.status(400).json({
                error: 'Missing required fields: to, subject, html'
            });
        }

        if (!isValidEmail(to)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        if (subject.length > 200) {
            return res.status(400).json({ error: 'Subject too long (max 200 chars)' });
        }

        const sanitizedHtml = sanitizeHtml(html);

        // HMAC validation solo en producción
        const isProduction = process.env.NODE_ENV === 'production';
        if (HMAC_SECRET && isProduction) {
            if (!signature) {
                return res.status(403).json({ error: 'Signature required' });
            }

            const hmac = crypto.createHmac('sha256', HMAC_SECRET);
            hmac.update(to + subject + html);
            const expected = hmac.digest('hex');

            if (signature !== expected) {
                return res.status(403).json({ error: 'Invalid signature' });
            }
        }

        // Configurar transporter
        const transporter = nodemailer.createTransport({
            host: 'ssl0.ovh.net',
            port: 465,
            secure: true,
            auth: {
                user: OVH_USER,
                pass: OVH_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 20000
        });

        // Enviar email
        const info = await transporter.sendMail({
            from: `"Correbars Esparreguera" <${OVH_USER}>`,
            to,
            subject,
            html: sanitizedHtml,
            text: html.replace(/<[^>]*>/g, '')
        });

        return res.status(200).json({
            ok: true,
            messageId: info.messageId,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('API Error:', {
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            ok: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
}