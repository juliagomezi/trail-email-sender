/**
 * Envía el correo usando tu endpoint de Vercel protegido.
 */
function sendViaVercel(to, subject, htmlBody) {
    // URL de tu deployment en Vercel
    const API_URL  = 'https://correbars-email-sender.vercel.app/api/send';
    // Claves almacenadas en Script Properties
    const props    = PropertiesService.getScriptProperties();
    const API_KEY  = props.getProperty('API_KEY');
    const HMAC_SEC = props.getProperty('HMAC_SECRET');

    // Opcional: firma HMAC SHA256 de (to+subject+html)
    let signature = null;
    if (HMAC_SEC) {
        const raw = to + subject + htmlBody;
        signature = Utilities
            .computeHmacSha256Signature(raw, HMAC_SEC)
            .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2))
            .join('');
    }

    const payload = { to, subject, html: htmlBody };
    if (signature) payload.signature = signature;

    const options = {
        method:        'post',
        contentType:   'application/json',
        headers:       { 'x-api-key': API_KEY },
        payload:       JSON.stringify(payload),
        muteHttpExceptions: true
    };

    const resp = UrlFetchApp.fetch(API_URL, options);
    if (resp.getResponseCode() !== 200) {
        throw new Error('Error en Vercel: ' + resp.getContentText());
    }
}

/**
 * Trigger: onFormSubmit
 * Se dispara cada vez que se envía el formulario.
 */
function onFormSubmit(e) {
    // ===== 1) Generar ID único =====
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    var props = PropertiesService.getScriptProperties();
    var lastId = props.getProperty('LAST_REG_ID') || 1000;
    var newId = parseInt(lastId, 10) + 1;
    props.setProperty('LAST_REG_ID', newId);

    lock.releaseLock();

    // ===== 2) Extraer datos del formulario =====
    var respuestas = e.namedValues;
    console.log(respuestas)
    var emailDest = respuestas["Adreça electrònica"][0];
    var nombre = respuestas["🙍‍♀️ Nom i Cognoms"][0];
    var talla = respuestas["👕 Talla de samarreta"][0];
    var alergias = respuestas["🍃Al·lèrgies o intoleràncies"]?.[0] || "Cap";
    var bocata = respuestas["🥪Entrepà"][0];
    var dni = respuestas["🪪 Número DNI"][0];
    var fecha = new Date(respuestas["Marca de temps"][0]);

    var basePrice = 25;
    var bocataExtra = bocata !== "❌No, no en vull" ? 3 : 0;
    var preuFinal = basePrice + bocataExtra;

    // ===== 3) Renderizar la plantilla HTML =====
    const tpl = HtmlService.createTemplateFromFile('TemplateEmail');
    tpl.regId = newId;
    tpl.nombre = nombre;
    tpl.talla = talla;
    tpl.alergias = alergias;
    tpl.bocata = bocata;
    tpl.dni = dni;
    tpl.data = Utilities.formatDate(fecha, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    tpl.preuFinal = preuFinal;

    const htmlBody = tpl.evaluate().getContent();

    // ===== 4) Enviar por tu API de Vercel (o GmailApp para debug) =====
    try {
        sendViaVercel(emailDest, `PREINSCRIPCIÓ CORREBARS 2025 #${newId}`, htmlBody);
    } catch (err) {
        Logger.log('Falló envío Vercel: ' + err);
        //GmailApp.sendEmail(emailDest, `PREINSCRIPCIÓ CORREBARS 2025 #${newId}`, '', { htmlBody: htmlBody });
    }

    // ===== 5) Registrar en hoja de “Envíos” =====
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Envíos');
    sheet.appendRow([
        new Date(),
        emailDest,
        newId,
        preuFinal + '€',
        'OK'
    ]);
}
