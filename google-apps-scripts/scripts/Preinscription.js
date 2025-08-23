const PRICE_ID_MAP = {
  "Trail de 18 kilòmetres - 22€": "price_1Rm9SCCkpFFDVi5jFulKIl6h",
  "Trail de 12 kilòmetres - 22€": "price_1Rm9SWCkpFFDVi5jFOVRTvRb",
  "Caminata popular - 15€": "price_1Rm9SmCkpFFDVi5jiaNBYcpZ",
};

const PRICE_MAP = {
  "Trail de 18 kilòmetres - 22€": "22",
  "Trail de 12 kilòmetres - 22€": "22",
  "Caminata popular - 15€": "15",
};

function sendPreinscriptionEmail(row, responses) {
  var email = responses["Adreça electrònica"][0];
  var trailMode = responses["Modalitat del trail"][0];
  var priceId = PRICE_ID_MAP[trailMode];
  if (!priceId) return;
  const tpl = HtmlService.createTemplateFromFile("PreinscriptionEmail");
  tpl.idCorredor = row;
  tpl.nomCorredor = responses["Nom i cognoms"][0];
  tpl.dataInscripcio = responses["Marca de temps"][0];
  tpl.dni = responses["DNI"][0];
  tpl.telefon = responses["Telèfon de contacte"][0];
  tpl.colla = responses["Colla"][0];
  tpl.modalitatTrail = trailMode;
  tpl.categoria = responses["Categoria"][0];
  tpl.tallaSamarreta = responses["Talla de la samarreta"][0];
  tpl.entrepa = responses["Entrepà"][0];
  tpl.alergies = responses["Al·lèrgies o intoleràncies"][0];
  tpl.preu = PRICE_MAP[trailMode];
  tpl.linkPagament = createPaymentLink(row, email, priceId);

  const htmlBody = tpl.evaluate().getContent();
  sendViaVercel(email, "Preinscripció Trail Intercasteller 2025", htmlBody);
}

function testOnFormSubmit() {
  const fakeEvent = {
    range: {
      getRow: () => 80 
    },
    namedValues: {
      "Adreça electrònica": ["juliagoes2000@gmail.com"],
      "Modalitat del trail": ["Mitja Marató"],
      "Nom i cognoms": ["Júlia"],
      "Marca de temps": ["2025-08-04 10:00:00"],
      "DNI": ["12345678A"],
      "Telèfon de contacte": ["600123456"],
      "Colla": ["Els Valents"],
      "Categoria": ["Sènior"],
      "Talla de la samarreta": ["M"],
      "Entrepà": ["Vegetarià"],
      "Al·lèrgies o intoleràncies": ["Cap"]
    }
  };

  onFormSubmit(fakeEvent);
}

function onFormSubmit(e) {
  var range = e.range
  var row = range.getRow(); // Participant row number

  var responses = e.namedValues;

  sendPreinscriptionEmail(row, responses)
}

function oldOnFormSubmit(e) {
  var range = e.range
  var sheetRow = range.getRow();

  var responses = e.namedValues;
  var email = responses["Adreça electrònica"][0];
  var trailMode = responses["Modalitat del trail"][0];
  var priceId = PRICE_ID_MAP[trailMode];

  if (!priceId) return;
  // Render HTML template
  const tpl = HtmlService.createTemplateFromFile("PreinscriptionEmail");
  tpl.idCorredor = sheetRow;
  tpl.nomCorredor = responses["Nom i cognoms"][0];
  tpl.dataInscripcio = responses["Marca de temps"][0];
  tpl.dni = responses["DNI"][0];
  tpl.telefon = responses["Telèfon de contacte"][0];
  tpl.colla = responses["Colla"][0];
  tpl.modalitatTrail = trailMode;
  tpl.categoria = responses["Categoria"][0];
  tpl.tallaSamarreta = responses["Talla de la samarreta"][0];
  tpl.entrepa = responses["Entrepà"][0];
  tpl.alergies = responses["Al·lèrgies o intoleràncies"][0];
  tpl.preu = PRICE_MAP[trailMode];

  tpl.linkWebPagament = `https://script.google.com/macros/s/AKfycbwXpf1NBjIsFRuAoBd0tJKQzNI6nXlLt9YwrrHgjffI7Nj2Voi1y5ms9ytD-d1pOpq8/exec?action=getLink&email=${encodeURIComponent(email)}&priceId=${priceId}`;

  const htmlBody = tpl.evaluate().getContent();

  sendViaVercel(email, "Preinscripció Trail Intercasteller 2025", htmlBody);
}

