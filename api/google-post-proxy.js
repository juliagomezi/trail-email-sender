import fetch from 'node-fetch';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjXIQyWjVmzrfggBJYR5TSWxIbJm13u7Uxeem4Ewu9AMgBT0xTlo9TCaVaAReTtNdj/exec"; // URL de tu Apps Script

export default async function handler(req, res) {
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

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body || {})
        });
        // Ignorar la resposta del Apps Script perquè fa un redirect 302
        return res.status(200).json({ ok: true, note: 'Apps Script returned 302' });

    } catch (err) {
        console.error('Error calling Apps Script:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
