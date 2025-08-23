function notifyLastYearPartipants() {
  const actualTrailSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastTrailSheet = SpreadsheetApp.openById('1tK30n0Hkntvq7vaOo200eQUhi1DB5ied0DjlbQWOltU').getSheets()[0]; // primer full del segon spreadsheet

  const lastTrailData = lastTrailSheet.getDataRange().getValues();
  const actualTrailData = actualTrailSheet.getDataRange().getValues();

  const header = lastTrailData[0];
  const emailIndex = header.indexOf('Correu electrònic');
  const nameIndex = header.indexOf('Nom i cognoms');

  for (let i = 255; i < lastTrailData.length; i++) {
    const row = lastTrailData[i];
    const email = String(row[emailIndex]).trim();
    const name = row[nameIndex];
// Ultim mail enviat: ivcreus@gmail.com
    if (!email) continue;

    // Comprovem si el correu existeix en actualTrailData no funciona
    let found = false;
    for (let j = 1; j < actualTrailData.length; j++) {
      if (actualTrailData[j][emailIndex] === email) {
        found = true;
        break;
      }
    }

    if (!found) {
      sendEmailLastYearPartipants(name, email); // Acció a fer si no hi és
      Utilities.sleep(5000)
    }
  }
}

function testSendEmail() {
  sendEmailLastYearPartipants("Albert Campaña Soler", "albert.campanya.soler@gmail.com")
}

// Aquesta és una funció dummy d'exemple
function sendEmailLastYearPartipants(name, email) {
  const tpl = HtmlService.createTemplateFromFile("NotifyNewTrailEmail");
  tpl.nomCorredor = name;

  const htmlBody = tpl.evaluate().getContent();

  sendViaVercel(email, "🏃‍♀️ Torna el Trail Intercasteller 🏃", htmlBody);
  Logger.log(`Correu enviat a ${email}`);
}
