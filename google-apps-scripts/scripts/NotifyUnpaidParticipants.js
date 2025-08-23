function notifyUnpaidParticipants() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const header = data[0];
  const emailIndex = header.indexOf('Adreça electrònica');
  const pagamentIndex = header.indexOf('Pagament');

  if (emailIndex === -1 || pagamentIndex === -1) {
    throw new Error("Falten les columnes 'Adreça electrònica' o 'Pagament'.");
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const pagament = row[pagamentIndex];

    if (!email || pagament) continue; // ignora si ja ha pagat o no hi ha email

    // TODO REVERT
    if (email == "juliagoes2000@gmail.com") {
      const tpl = HtmlService.createTemplateFromFile("NotifyUnpaidParticipantsEmail");
      tpl.nomCorredor = row[2];         // Columna C
      tpl.dataInscripcio = row[0];      // Columna A
      tpl.dni = row[3];                 // Columna D
      tpl.telefon = row[5];             // Columna F
      tpl.colla = row[6];               // Columna G
      tpl.categoria = row[8];           // Columna I
      tpl.tallaSamarreta = row[9];      // Columna J
      tpl.entrepa = row[10];            // Columna K
      tpl.alergies = row[11];           // Columna L
      var trailMode = row[7];           // Columna H
      tpl.modalitatTrail = trailMode;
      tpl.preu = PRICE_MAP[trailMode];
      // TDOO REVERT
      // var priceId = PRICE_ID_MAP[trailMode];
      var priceId ="price_1RsQxMCZZbe06Saa4yMQ02Ua"
      // TODO QUAN HO TORNEM A EXECUTAR NO CRIDAR A CREATE PAYMENT LINK!  FER FUNCION GETPAYMENTLINK
      tpl.linkPagament = createPaymentLink(i + 1, email, priceId);
    
      const htmlBody = tpl.evaluate().getContent();
    
      sendViaVercelAttachment(email, "Recordatori preinscripció - Trail Intercasteller 2025", htmlBody);
      Logger.log(`Correu enviat a ${email} fila ${row}`);
      Utilities.sleep(5000)
    }
  }
}