function CreatePaymentLink(email, priceId) {
  const STRIPE_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

  const payload = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]": `https://script.google.com/macros/s/AKfycbxtkq7ZpQBgELFJypSfMZdPmgeUmr85ZucmQCfdm6m-puvP6r7hFZpbFIVOmTB-l0ee/exec?email=${encodeURIComponent(email)}`,
    "metadata[customer_email]": email,
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`
    },
    payload: Object.entries(payload).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  };

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_links', options);
  const paymentLink = JSON.parse(response.getContentText()).url;
  const paymentLinkId = JSON.parse(response.getContentText()).id;
  Logger.log(paymentLink);
  Logger.log(paymentLinkId);

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var paymentLinkColumn = headers.indexOf("Link de pagament");
  var paymentLinkIdColumn = headers.indexOf("Id link de pagament");

  userRow = GetUserRow(email)
  
  sheet.getRange(userRow + 1, paymentLinkColumn + 1).setValue(paymentLink);
  sheet.getRange(userRow + 1, paymentLinkIdColumn + 1).setValue(paymentLinkId);

}

function GetUserRow(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var emailColumn = headers.indexOf("Adreça electrònica");
  for (var i = 1; i < values.length; i++) {
    if (values[i][emailColumn] === email) {
      Logger.log("Email found %s", email);
      Logger.log("Email found in row %s", i);
      return i
    }
  }
}

function GetUserPaymentLinkId(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var paymentLinkIdColumn = headers.indexOf("Id link de pagament");
  var userRow = GetUserRow(email)
  return values[userRow][paymentLinkIdColumn]
}

function DisablePaymentLink(email) {
  var paymentLinkId = GetUserPaymentLinkId(email)
  const STRIPE_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

  const payload = {
    active: "false"
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`
    },
    payload: Object.entries(payload).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  };

  const url = `https://api.stripe.com/v1/payment_links/${paymentLinkId}`;
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  Logger.log(`Payment Link ${url} desactivado: ${data.active === false}`);
}
