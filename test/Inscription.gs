function sendViaVercelAttachment(to, subject, htmlBody) {
  const VERCEL_SERVER_API_URL = PropertiesService.getScriptProperties().getProperty('VERCEL_SERVER_API_URL');
  const VERCEL_SERVER_API_KEY = PropertiesService.getScriptProperties().getProperty('VERCEL_SERVER_API_KEY');

  const bases = DriveApp.getFileById('1EyYhH45ChxPyjocXAAf_Ol-YKwaQKA1c')
  const pdfBlob = bases.getBlob().setName('bases_trail_2025.pdf')
  const filename = pdfBlob.getName();
  const content = Utilities.base64Encode(pdfBlob.getBytes());
  const contentType = pdfBlob.getContentType();
  const payload = { 
    to, 
    subject, 
    html: htmlBody, 
    attachments: [{
      filename,
      content,
      contentType
    }]
  };

  const options = {
    method:        'post',
    contentType:   'application/json',
    headers:       { 'x-api-key': VERCEL_SERVER_API_KEY },
    payload:       JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resp = UrlFetchApp.fetch(VERCEL_SERVER_API_URL, options);
  if (resp.getResponseCode() !== 200) {
    throw new Error('Error en Vercel: ' + resp.getContentText());
  }
}

function sendInscriptionEmail(rowValues, rowNumber, email, inscriptionTimeFormatted) {
  const tpl = HtmlService.createTemplateFromFile("InscriptionEmail");
  tpl.idCorredor = rowNumber;
  tpl.nomCorredor = rowValues[2]; // Nom i cognoms (columna C)
  tpl.dataInscripcio = inscriptionTimeFormatted;
  tpl.dni = rowValues[3]; // DNI (columna D)
  tpl.telefon = rowValues[5]; // Telèfon de contacte (columna F)
  tpl.colla = rowValues[6]; // Colla (columna G)
  tpl.modalitatTrail = rowValues[7]; // Modalitat del trail (columna H)
  tpl.categoria = rowValues[8]; // Categoria (columna I)
  tpl.tallaSamarreta = rowValues[9]; // Talla samarreta (columna J)
  tpl.entrepa = rowValues[10]; // Entrepà (columna K)
  tpl.alergies = rowValues[11]; // Al·lèrgies o intoleràncies (columna L)

  const htmlBody = tpl.evaluate().getContent();

  sendViaVercelAttachment(email, "Inscripció Trail Intercasteller 2025", htmlBody);
  return tpl.evaluate().setTitle("Inscripció Trail Intercasteller 2025")
}

function doGet(e) {
  Logger.log("doGet start");

  const action = e.parameter.action;
  var email = e.parameter.email;
  var priceId = e.parameter.priceId;

  switch (action) {
    case 'getLink':
      return GetPaymentWeb(email, priceId);
    default:
      const trailEmail = "trailintercasteller@gmail.com"
      const subjectEmail = "Error al marcar inscrit com a pagat"
      try {
        var email = e.parameter.email;
        if (!email) {
          GmailApp.sendEmail(trailEmail, subjectEmail, "No hi ha email a la URL que crida el Stripe.")
          return ContentService.createTextOutput("Missing email").setMimeType(ContentService.MimeType.TEXT);
        }

        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
        var values = sheet.getDataRange().getValues();
        var headers = values[0];
        var emailColmumn = headers.indexOf("Adreça electrònica");
        var paymentColumn = headers.indexOf("Pagament");

        // Find the row with the matching email
        for (var i = 1; i < values.length; i++) {
          if (values[i][emailColmumn] === email) {
            Logger.log("Email found %s", email);
            Logger.log("Email found in row %s", i);
            var inscriptionTime = new Date();
            var inscriptionTimeFormatted = Utilities.formatDate(inscriptionTime, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
            sheet.getRange(i + 1, paymentColumn + 1).setValue(inscriptionTimeFormatted);
            return sendInscriptionEmail(values[i], i + 1, email, inscriptionTimeFormatted);
          }
        }

        GmailApp.sendEmail(trailEmail, subjectEmail, "S'ha pagat amb email " + email + " i no apareix a la fulla de càlcul." )
        return ContentService.createTextOutput("Email not found").setMimeType(ContentService.MimeType.TEXT);
      } catch (err) {
        return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
      }
  } 
}