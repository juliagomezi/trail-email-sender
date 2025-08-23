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
}

function oldDoGet(e) {
  Logger.log("doGet start");

  const action = e.parameter.action;
  var email = e.parameter.email;
  var priceId = e.parameter.priceId;

  switch (action) {
    case 'getLink':
      return GetPaymentWeb(email, priceId);
    default:
      try {
        var email = e.parameter.email;
        if (!email) {
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
        return ContentService.createTextOutput("Email not found").setMimeType(ContentService.MimeType.TEXT);
      } catch (err) {
        return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
      }
  } 
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    var obj = payload.data.object;
    var email = obj.metadata.customer_email;
    var row = obj.metadata.customer_row;
    Logger.log(`doPost for ${email}`);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var paymentColumn = headers.indexOf("Pagament") + 1;
    var inscriptionTime = new Date();
    var inscriptionTimeFormatted = Utilities.formatDate(inscriptionTime, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    sheet.getRange(row, paymentColumn).setValue(inscriptionTimeFormatted);
    Logger.log(`doPost for ${email}: set paid at ${inscriptionTimeFormatted}`);
    disablePaymentLink(row);
    Logger.log(`doPost for ${email}: disabled payment link`);
    sendInscriptionEmail(values[row-1], row, email, inscriptionTimeFormatted);
    Logger.log(`doPost for ${email}: sent inscription email`);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "OK" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
