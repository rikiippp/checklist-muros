# 📧 Guía de Personalización de Emails de Firebase

Esta guía te ayudará a personalizar los correos electrónicos de Firebase (restablecimiento de contraseña, verificación de email, etc.) con el branding de MUROS.

## 🎨 Información de Branding MUROS

- **Color primario:** `#f07e0e` (Naranja)
- **Nombre:** MUROS
- **Logo:** `assets/favIcon.png` o `assets/logo.png`

## 📋 Paso 1: Configurar Plantillas de Email en Firebase Console

### 1.1 Acceder a las Plantillas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **muros-checklist**
3. Ve a **Authentication** > **Templates**
4. Haz clic en **Password reset** (Restablecimiento de contraseña)

### 1.2 Personalizar la Plantilla

En la sección **Email template**, puedes personalizar:

#### **Subject (Asunto):**
```
Restablece tu contraseña de MUROS
```

#### **Body (Cuerpo del email):**

Copia y pega este HTML personalizado:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
    }
    .title {
      color: #f07e0e;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #f07e0e;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #d86e0c;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .link {
      color: #f07e0e;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">MUROS</div>
      <p style="color: #666; margin: 0;">Sistema de Gestión de Tareas</p>
    </div>
    
    <div class="content">
      <h2 style="color: #333;">Restablece tu contraseña</h2>
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en MUROS.</p>
      <p>Haz clic en el botón siguiente para crear una nueva contraseña:</p>
      
      <div style="text-align: center;">
        <a href="%LINK%" class="button">Restablecer contraseña</a>
      </div>
      
      <p>O copia y pega este enlace en tu navegador:</p>
      <p><a href="%LINK%" class="link">%LINK%</a></p>
      
      <p style="margin-top: 30px;"><strong>¿No solicitaste este cambio?</strong></p>
      <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.</p>
      
      <p style="margin-top: 20px; padding: 15px; background-color: #fff3e0; border-left: 4px solid #f07e0e; border-radius: 4px;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
      </p>
    </div>
    
    <div class="footer">
      <p>Este correo fue enviado por MUROS</p>
      <p>Si tienes preguntas, contacta al administrador del sistema.</p>
      <p style="margin-top: 10px; color: #999;">© 2025 MUROS. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

#### **Variables disponibles:**
- `%LINK%` - Se reemplaza automáticamente con el enlace de restablecimiento
- `%EMAIL%` - Se reemplaza con el email del usuario
- `%DISPLAY_NAME%` - Se reemplaza con el nombre del usuario (si está disponible)

### 1.3 Guardar los Cambios

1. Haz clic en **Save** (Guardar)
2. Los cambios se aplicarán inmediatamente

## 📧 Paso 2: Configurar Otros Emails (Opcional)

### Email de Verificación

1. Ve a **Authentication** > **Templates** > **Email address verification**
2. Personaliza con el mismo estilo y branding

**Asunto sugerido:**
```
Verifica tu correo electrónico - MUROS
```

### Email de Bienvenida (si está habilitado)

1. Ve a **Authentication** > **Templates** > **Email address change**
2. Personaliza según sea necesario

## 🛡️ Paso 3: Reducir Correos en Spam

Para evitar que los correos vayan a spam, necesitas configurar un dominio personalizado:

### 3.1 Configurar Dominio Personalizado (Recomendado)

1. Ve a **Authentication** > **Settings** > **Authorized domains**
2. Agrega tu dominio personalizado (ej: `muros.com`)
3. Configura los registros DNS:
   - **SPF:** `v=spf1 include:_spf.google.com ~all`
   - **DKIM:** Firebase te proporcionará las claves
   - **DMARC:** Configura según tus necesidades

### 3.2 Alternativa: Mejorar Reputación del Dominio

Si no tienes dominio personalizado:
- Asegúrate de que los usuarios marquen los correos como "No spam"
- Usa un remitente claro y consistente
- Evita enviar demasiados correos en poco tiempo

## ✅ Paso 4: Probar los Cambios

1. Usa la función "Olvidé mi contraseña" en la app
2. Revisa el correo recibido
3. Verifica que:
   - El diseño se vea correcto
   - Los colores sean los de MUROS (#f07e0e)
   - El texto esté en español
   - El enlace funcione correctamente

## 📝 Notas Importantes

- **Logo:** Si quieres agregar el logo de MUROS, necesitarás subirlo a un servidor web y usar la URL completa en el HTML (ej: `<img src="https://tudominio.com/logo.png" class="logo">`)
- **Limitaciones:** Firebase tiene algunas limitaciones en la personalización HTML
- **Pruebas:** Siempre prueba los correos antes de usarlos en producción
- **Idioma:** Todos los textos deben estar en español

## 🔧 Solución de Problemas

### Los correos siguen yendo a spam
- Configura SPF/DKIM/DMARC con dominio personalizado
- Pide a los usuarios que marquen como "No spam"
- Considera usar un servicio de email profesional (SendGrid, Mailgun) con Cloud Functions

### El HTML no se renderiza correctamente
- Usa HTML simple, evita CSS complejo
- Prueba en diferentes clientes de email
- Usa tablas para layout si es necesario (algunos clientes no soportan flexbox)

### El logo no aparece
- Sube el logo a un servidor web accesible
- Usa URL absoluta (https://...)
- Verifica que la imagen sea accesible públicamente

## 📚 Recursos Adicionales

- [Documentación oficial de Firebase Email Templates](https://firebase.google.com/docs/auth/custom-email-handler)
- [Guía de SPF/DKIM para Firebase](https://firebase.google.com/docs/auth/email-action-handler)

