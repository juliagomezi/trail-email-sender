# 📧 Correbars Email Sender API

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-14%2B-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Deployment](https://img.shields.io/badge/deployment-Vercel-black)

Una API serverless para enviar correos electrónicos desde aplicaciones del Club Correbars Esparreguera. Esta API proporciona una interfaz segura y fácil de usar para enviar correos electrónicos a través de OVH SMTP.

## ✨ Características

- 🔒 Autenticación mediante API Key
- 🛡️ Validación HMAC para mayor seguridad
- 🧹 Sanitización de contenido HTML
- ⏱️ Limitación de tasa (rate limiting)
- 📝 Validación de direcciones de correo
- 🌐 Soporte para CORS
- 🚀 Desplegado como función serverless en Vercel

## 🚀 Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/correbars-email-sender.git
   cd correbars-email-sender
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` con las siguientes variables:
   ```
   API_KEY=tu_clave_api_secreta
   OVH_USER=tu_usuario_ovh@dominio.com
   OVH_PASS=tu_contraseña_ovh
   HMAC_SECRET=tu_secreto_hmac
   API_ENDPOINT=http://localhost:3000/api/send
   ```

## 💻 Desarrollo

Para ejecutar el servidor de desarrollo:

```bash
npm run dev
```

O específicamente en el puerto 3000:

```bash
npm start
```

## 🧪 Pruebas

Para ejecutar las pruebas:

```bash
npm test
```

Esto enviará un correo electrónico de prueba utilizando la configuración de tu archivo `.env`.

## 📤 Uso de la API

### Endpoint

```
POST /api/send
```

### Cabeceras

```
Content-Type: application/json
x-api-key: tu_clave_api
```

### Cuerpo de la solicitud

```json
{
  "to": "destinatario@ejemplo.com",
  "subject": "Asunto del correo",
  "html": "<p>Contenido HTML del correo</p>",
  "signature": "firma_hmac_opcional"
}
```

### Generación de firma HMAC (para entornos de producción)

```javascript
const crypto = require('crypto');

function generateSignature(to, subject, html, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(to + subject + html);
  return hmac.digest('hex');
}
```

### Ejemplo de respuesta exitosa

```json
{
  "ok": true,
  "messageId": "<mensaje_id>",
  "timestamp": "2023-06-01T12:34:56.789Z"
}
```

## 🚀 Despliegue

Para desplegar en Vercel:

```bash
npm run deploy
```

## 🔒 Seguridad

- La API requiere una clave API para todas las solicitudes
- En producción, se requiere una firma HMAC para verificar la integridad de los datos
- Se implementa limitación de tasa para prevenir abusos (30 solicitudes por minuto)
- Todo el contenido HTML se sanitiza para prevenir ataques XSS

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT.

---

Desarrollado con ❤️ para la Colla de Diables d'Esparreguera