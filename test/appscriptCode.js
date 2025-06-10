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
        const rawBytes = Utilities.newBlob(raw).getBytes();
        const secretBytes = Utilities.newBlob(HMAC_SEC).getBytes();

        const hmacBytes = Utilities.computeHmacSha256Signature(rawBytes, secretBytes);
        signature = hmacBytes
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
    var lastId = props.getProperty('LAST_REG_ID') || 0;
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

    // ===== 2.5) Guardar ID en la hoja de respuestas del formulario =====
    var range = e.range;
    var row = range.getRow();
    var sheet = range.getSheet();

    // Buscar la primera columna vacía o crear una nueva columna para el ID
    var lastCol = sheet.getLastColumn();
    var idColumn = lastCol + 1;

    // Verificar si ya existe una columna "ID Inscripción" en el encabezado
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idColIndex = headers.indexOf("ID Inscripción");
    var estadoColIndex = headers.indexOf("Estado Envío");

    if (idColIndex === -1) {
        // Si no existe la columna, crearla
        sheet.getRange(1, idColumn).setValue("ID Inscripción");
        sheet.getRange(row, idColumn).setValue(newId);
    } else {
        // Si ya existe, usar esa columna (índice + 1 porque getRange usa base 1)
        sheet.getRange(row, idColIndex + 1).setValue(newId);
    }

    if (estadoColIndex === -1) {
        estadoColIndex = lastCol + 1;
        sheet.getRange(1, estadoColIndex + 1).setValue("Estado Envío");
    }


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
    let envioExitoso = false;
    try {
        sendViaVercel(emailDest, `🍻 PREINSCRIPCIÓ CORREBARS 2025 🍻 #${newId}`, htmlBody);
        envioExitoso = true;
    } catch (err) {
        Logger.log('Falló envío Vercel: ' + err);
        try {


            MailApp.sendEmail({
                to: emailDest,
                name: "Organització Correbars 2025",
                subject: `🍻 PREINSCRIPCIÓ CORREBARS 2025 🍻 #${newId}`,
                htmlBody: htmlBody
            });
            envioExitoso = true;
        } catch (gmailErr) {
            Logger.log('También falló Gmail: ' + gmailErr);
        }
    }

    sheet.getRange(row, estadoColIndex + 1).setValue(envioExitoso ? true : false);


    // ===== 5) Registrar en hoja de “Envíos” =====
    const enviosSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Envíos');
    enviosSheet.appendRow([
        new Date(),
        emailDest,
        newId,
        preuFinal + '€',
        envioExitoso ? 'OK' : 'KO'
    ]);
}

function retryFailedEmail(e) {
    var sheet = e.source.getActiveSheet();
    var range = e.range;

    console.log(range.getColumn())

    if(range.getColumn() == 13 && range.getValue() == true) {
        var row = range.getRow();
        var emailDest = sheet.getRange(row, 2).getValue();
        var nombre = sheet.getRange(row, 3).getValue();
        var talla = sheet.getRange(row, 5).getValue();
        var alergias = sheet.getRange(row, 8).getValue();
        var bocata = sheet.getRange(row, 6).getValue();
        var dni = sheet.getRange(row, 4).getValue();
        var fecha = new Date(sheet.getRange(row, 1).getValue());

        var basePrice = 25;
        var bocataExtra = bocata !== "❌No, no en vull" ? 3 : 0;
        var preuFinal = basePrice + bocataExtra;
        var newId = sheet.getRange(row, 12).getValue();

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
        let envioExitoso = false;
        try {
            sendViaVercel(emailDest, `🍻 PREINSCRIPCIÓ CORREBARS 2025 🍻 #${newId}`, htmlBody);
            envioExitoso = true;
        } catch (err) {
            Logger.log('Falló envío Vercel: ' + err);
            try {


                MailApp.sendEmail({
                    to: emailDest,
                    name: "Organització Correbars 2025",
                    subject: `🍻 PREINSCRIPCIÓ CORREBARS 2025 🍻 #${newId}`,
                    htmlBody: htmlBody
                });
                envioExitoso = true;
            } catch (gmailErr) {
                Logger.log('También falló Gmail: ' + gmailErr);
            }
        }
        var lastCol = sheet.getLastColumn();

        // Verificar si ya existe una columna "ID Inscripción" en el encabezado
        var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var estadoColIndex = headers.indexOf("Estado Envío");
        sheet.getRange(row, estadoColIndex + 1).setValue(envioExitoso ? true : false);


        // ===== 5) Registrar en hoja de “Envíos” =====
        const enviosSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Envíos');
        enviosSheet.appendRow([
            new Date(),
            emailDest,
            newId,
            preuFinal + '€',
            envioExitoso ? 'Retry OK' : 'Retry KO'
        ]);

    }

}

