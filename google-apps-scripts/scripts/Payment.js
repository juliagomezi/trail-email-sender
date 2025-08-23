function createPaymentLink(row, email, priceId) {
  const STRIPE_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

  const payload = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]": `https://sites.google.com/view/trail-intercasteller-sucess/p%C3%A0gina-principal`,
    "metadata[customer_email]": email,
    "metadata[customer_row]": row,
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

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var paymentLinkColumn = headers.indexOf("Link de pagament") + 1;
  var paymentLinkIdColumn = headers.indexOf("Id link de pagament") + 1;
  
  sheet.getRange(row, paymentLinkColumn).setValue(paymentLink);
  sheet.getRange(row, paymentLinkIdColumn).setValue(paymentLinkId);
  
  Logger.log(`Created payment link for ${email} in row ${row}: payment link ${paymentLink} and paymentLinkId ${paymentLinkId}`);
  return paymentLink;
}

function disablePaymentLink(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari");
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var paymentLinkIdColumn = headers.indexOf("Id link de pagament");
  var paymentLinkId = values[row-1][paymentLinkIdColumn];
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
