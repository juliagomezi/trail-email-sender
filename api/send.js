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

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown';
}

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req) => {
        const clientIP = getClientIP(req);
        const apiKey = req.headers['x-api-key'] || 'no-key';
        return `${clientIP}-${apiKey}`;
    },
    skip: (req) => {
        return false;
    }
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
        try {
            await new Promise((resolve, reject) => {
                limiter(req, res, (err) => err ? reject(err) : resolve());
            });
        } catch (rateLimitError) {
            console.error('Rate limit error:', rateLimitError);
        }

        let body;
        try {
            body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
        } catch (e) {
            console.error('JSON parse error:', e);
            return res.status(400).json({ error: 'Invalid JSON format' });
        }

        const { to, subject, html, signature, attachments } = body;

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

        // Validar attachments si existen
        if (attachments && Array.isArray(attachments)) {
            const totalSize = attachments.reduce((acc, att) => {
                if (!att.filename || !att.content || !att.contentType) {
                    throw new Error('Invalid attachment format');
                }
                // Estimar tamaño del base64 (aprox 4/3 del tamaño original)
                return acc + (att.content.length * 0.75);
            }, 0);

            // Límite de 25MB total para attachments
            if (totalSize > 25 * 1024 * 1024) {
                return res.status(400).json({ error: 'Attachments too large (max 25MB total)' });
            }
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

        // Configurar transporter con opciones anti-spam
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
            socketTimeout: 20000,
            // Configuraciones adicionales para evitar spam
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 20000,
            rateLimit: 5
        });

        // Preparar attachments para nodemailer
        let emailAttachments = [];
        if (attachments && Array.isArray(attachments)) {
            emailAttachments = attachments.map(att => ({
                filename: att.filename,
                content: Buffer.from(att.content, 'base64'),
                contentType: att.contentType
            }));
        }

        // Crear texto plano más limpio para evitar filtros de spam
        const textContent = html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();

        // Configurar email con headers anti-spam
        const mailOptions = {
            from: {
                name: 'Correbars Esparreguera',
                address: OVH_USER
            },
            to,
            subject,
            html: sanitizedHtml,
            text: textContent,
            attachments: emailAttachments,
            // Headers adicionales para evitar spam
            headers: {
                'X-Mailer': 'Correbars Mailer v1.0',
                'List-Unsubscribe': `<mailto:${OVH_USER}?subject=Unsubscribe>`,
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
                'Importance': 'Normal',
                // SPF y DKIM se configuran a nivel de dominio
                'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
            },
            // Configuraciones adicionales
            messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@esparreguera.correbars>`,
            date: new Date(),
            encoding: 'utf-8'
        };

        // Enviar email
        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            ok: true,
            messageId: info.messageId,
            timestamp: new Date().toISOString(),
            attachmentCount: emailAttachments.length
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