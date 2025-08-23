function sendViaVercel(to, subject, htmlBody) {
  const VERCEL_SERVER_API_URL = PropertiesService.getScriptProperties().getProperty('VERCEL_SERVER_API_URL');
  const VERCEL_SERVER_API_KEY = PropertiesService.getScriptProperties().getProperty('VERCEL_SERVER_API_KEY');

  const payload = { to, subject, html: htmlBody };

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