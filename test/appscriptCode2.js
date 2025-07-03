

const PRODUCT_MAP = {
  "Trail de 18 kilòmetres - 22€": "price_1RfnqiCkpFFDVi5jMQilgKFZ",
  "Trail de 12 kilòmetres - 22€": "price_1RfnqwCkpFFDVi5jwGctVy6N",
  "Caminata popular - 15€": "price_1Rfnr8CkpFFDVi5jF2nfX8hR",
};

function onFormSubmit(e) {
  var range = e.range
  var sheet = range.getSheet();
  var row = range.getRow();

  var responses = e.namedValues;
  var email = responses["Adreça electrònica"][0];
  var product = responses["Recorregut del trail"][0];
  var priceId = PRODUCT_MAP[product];

  // const email = "juliagoes2000@gmail.com";
  // const product = "Caminata popular - 15€";
  // const priceId = "price_1Rfnr8CkpFFDVi5jF2nfX8hR";

  if (!priceId) return;

  const payload = {
    "mode": "payment",
    "success_url": "https://sites.google.com/view/trail-intercasteller-sucess",
    "cancel_url": "https://sites.google.com/view/trail-intercasteller-error",
    "customer_email": email,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1"
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    payload: Object.entries(payload).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  };

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', options);
  const session = JSON.parse(response.getContentText());

  const paymentLink = session.url;
  

  sheet.getRange(row, 13).setValue(paymentLink);

  const asunto = "Completa tu pago para " + product;
  const mensaje = `${paymentLink}`;

  GmailApp.sendEmail(email, asunto, mensaje);
}

//function doPost(e) {
//  try {
//    const postData = JSON.parse(e.postData.contents);
//
//    if (postData.type === 'checkout.session.completed') {
//      const session = postData.data.object;
//
//      if (session.payment_status !== 'paid') {
//        return ContentService.createTextOutput(
//          JSON.stringify({status: "ignored", reason: "payment not completed"})
//        ).setMimeType(ContentService.MimeType.JSON);
//      }
//
//      const email = session.customer_details.email;
//      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes");
//      const dataRange = sheet.getDataRange().getValues();
//      for (let i = 1; i < dataRange.length; i++) {
//        if (dataRange[i][1] === email) {
//          sheet.getRange(i + 1, 13).setValue("Pagat");
//          break;
//        }
//      }
//      
//      return ContentService.createTextOutput(
//        JSON.stringify({status: "ok"})
//      ).setMimeType(ContentService.MimeType.JSON);
//    }
//
//    return ContentService.createTextOutput(
//      JSON.stringify({status: "ignored", reason: "not a checkout.session.completed event"})
//    ).setMimeType(ContentService.MimeType.JSON);
//
//  } catch (err) {
//    return ContentService.createTextOutput(
//      JSON.stringify({error: err.toString()})
//      ).setMimeType(ContentService.MimeType.JSON);
//  }
//}
//
//

function doPost(e) {
  return ContentService.createTextOutput("Webhook recibido").setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService.createTextOutput("¡Webhook activo!").setMimeType(ContentService.MimeType.TEXT);
}
