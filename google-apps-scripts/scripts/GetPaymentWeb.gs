const ID_TO_PRICE_MAP = {
  "price_1Rm9SCCkpFFDVi5jFulKIl6h": "22",
  "price_1Rm9SWCkpFFDVi5jFOVRTvRb": "22",
  "price_1Rm9SmCkpFFDVi5jiaNBYcpZ": "15",
};

function GetPaymentWeb(email, priceId) {
  const payload = {
    "mode": "payment",
    "success_url": `https://script.google.com/macros/s/AKfycbxtkq7ZpQBgELFJypSfMZdPmgeUmr85ZucmQCfdm6m-puvP6r7hFZpbFIVOmTB-l0ee/exec?email=${encodeURIComponent(email)}`,
    "cancel_url": "https://sites.google.com/view/trail-intercasteller-error",
    "customer_email": email,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1"
  };

  const STRIPE_SECRET_KEY = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY');

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    payload: Object.entries(payload).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  };

  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', options);
  const session = JSON.parse(response.getContentText());
  const paymentLink = session.url;

  // Render HTML template

  var price = ID_TO_PRICE_MAP[priceId];

  const tpl = HtmlService.createTemplateFromFile("PaymentWeb");
  tpl.preu = price;
  tpl.linkPagament = paymentLink;

  return tpl.evaluate();
}
