# 🌐 Guía Completa: Configurar Dominio Personalizado y Correo Profesional

Esta guía te ayudará a configurar tu dominio **murosnegocios.com** y correo **info@murosnegocios.com** con Firebase para que los correos no vayan a spam y tengan tu branding completo.

## 📋 Información Necesaria

- **Dominio:** murosnegocios.com
- **Correo profesional:** info@murosnegocios.com
- **Hosting de correo:** Hostinger
- **Proyecto Firebase:** muros-checklist

---

## 🎯 PASO 1: Subir el Logo a Cloudinary (Para Avatar del Correo)

### 1.1 Subir el Logo

1. Ve a tu cuenta de Cloudinary: https://console.cloudinary.com/
2. Ve a **Media Library**
3. Haz clic en **Upload** (Subir)
4. Sube el archivo `assets/favIcon.png` o `assets/logo.png`
5. Una vez subido, haz clic en el archivo
6. Copia la **URL completa** (ejemplo: `https://res.cloudinary.com/dthp8pdsa/image/upload/v1234567890/logo.png`)

**⚠️ IMPORTANTE:** Guarda esta URL, la necesitarás más adelante.

### 1.2 Obtener URL Pública del Logo

Si prefieres usar una URL más limpia:
1. En Cloudinary, ve a **Settings** > **Upload**
2. Configura un **Upload Preset** si no lo tienes
3. Sube el logo y copia la URL `secure_url` que aparece

**URL del logo guardada:** `_________________________________`

---

## 🔧 PASO 2: Configurar Dominio en Firebase Console

### 2.1 Acceder a Configuración de Dominios

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **muros-checklist**
3. Ve a **Authentication** (Autenticación)
4. Haz clic en **Settings** (Configuración) en el menú lateral
5. Desplázate hasta la sección **Authorized domains** (Dominios autorizados)

### 2.2 Agregar Dominio Personalizado

1. Haz clic en **Add domain** (Agregar dominio)
2. Ingresa: `murosnegocios.com`
3. Haz clic en **Add** (Agregar)
4. **Anota la información que aparece:**
   - **TXT Record** para verificación
   - **CNAME Record** (si aplica)

**⚠️ NO CIERRES ESTA VENTANA** - Necesitarás estos datos en el siguiente paso.

---

## 📧 PASO 3: Configurar Registros DNS en Hostinger

### 3.1 Acceder al Panel de Hostinger

1. Ve a [hPanel de Hostinger](https://hpanel.hostinger.com/)
2. Inicia sesión con tu cuenta
3. Ve a **Dominios** > **murosnegocios.com**
4. Haz clic en **DNS / Zona de nombres**

### 3.2 Agregar Registro TXT de Verificación de Firebase

1. Haz clic en **Agregar registro** o **Add record**
2. Selecciona tipo: **TXT**
3. **Nombre/Host:** `@` (o deja vacío si Hostinger lo requiere así)
4. **Valor/Contenido:** Pega el valor del **TXT Record** que te dio Firebase
5. **TTL:** 3600 (o el valor por defecto)
6. Haz clic en **Guardar** o **Save**

### 3.3 Agregar Registro SPF (Sender Policy Framework)

1. Haz clic en **Agregar registro**
2. Tipo: **TXT**
3. **Nombre/Host:** `@`
4. **Valor/Contenido:** 
   ```
   v=spf1 include:_spf.google.com include:hostinger.com ~all
   ```
5. **TTL:** 3600
6. Guarda

**⚠️ NOTA:** Si ya tienes un registro SPF, edítalo para incluir `include:_spf.google.com` en lugar de crear uno nuevo.

### 3.4 Verificar Registros Existentes

Antes de continuar, verifica si ya tienes estos registros:
- **SPF:** Si existe, edítalo para incluir `include:_spf.google.com`
- **DKIM:** Si Hostinger lo genera automáticamente, está bien
- **DMARC:** Si no existe, lo agregaremos después

### 3.5 Esperar Propagación DNS

- Los cambios DNS pueden tardar **15 minutos a 48 horas**
- Normalmente toma **1-2 horas**
- Puedes verificar en: https://dnschecker.org/

---

## 🔐 PASO 4: Configurar DKIM en Firebase

### 4.1 Obtener Claves DKIM de Firebase

1. En Firebase Console, ve a **Authentication** > **Settings** > **Authorized domains**
2. Busca tu dominio `murosnegocios.com`
3. Haz clic en **View setup instructions** (Ver instrucciones de configuración)
4. Firebase te mostrará las claves DKIM que necesitas

### 4.2 Agregar Registros DKIM en Hostinger

Firebase te dará algo como:
```
Tipo: TXT
Nombre: google._domainkey
Valor: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

1. En Hostinger, ve a **DNS / Zona de nombres**
2. Haz clic en **Agregar registro**
3. Tipo: **TXT**
4. **Nombre/Host:** `google._domainkey` (o el que Firebase te indique)
5. **Valor/Contenido:** Pega el valor completo que Firebase te dio
6. **TTL:** 3600
7. Guarda

**Repite este proceso** para cada registro DKIM que Firebase te proporcione (pueden ser 2-3 registros).

---

## 📨 PASO 5: Configurar Remitente Personalizado en Firebase

### 5.1 Configurar Email de Remitente

1. En Firebase Console, ve a **Authentication** > **Settings**
2. Busca la sección **Email action handler** (Manejador de acciones de email)
3. Haz clic en **Customize action URL** (Personalizar URL de acción)
4. Ingresa: `https://murosnegocios.com/__/auth/action`
5. Guarda

### 5.2 Configurar Nombre y Avatar del Remitente

**Nota:** Firebase no permite cambiar directamente el remitente del email, pero puedes personalizar la plantilla para que se vea como si viniera de info@murosnegocios.com.

1. Ve a **Authentication** > **Templates**
2. Haz clic en **Password reset**
3. En **From name** (Nombre del remitente), escribe: `MUROS - Sistema de Tareas`
4. En **From email** (Email del remitente), Firebase usará `noreply@muros-checklist.firebaseapp.com` por defecto

**⚠️ IMPORTANTE:** Para usar `info@murosnegocios.com` como remitente, necesitarás configurar un dominio personalizado completo (ver Paso 6).

---

## 🎨 PASO 6: Personalizar Plantilla de Email con Logo

### 6.1 Acceder a Plantilla de Restablecimiento de Contraseña

1. En Firebase Console, ve a **Authentication** > **Templates**
2. Haz clic en **Password reset** (Restablecimiento de contraseña)
3. Asegúrate de que el idioma esté en **Español** (Spanish)

### 6.2 Configurar Asunto

En **Subject** (Asunto), escribe:
```
Restablece tu contraseña de MUROS
```

### 6.3 Configurar Cuerpo del Email

En **Body** (Cuerpo), copia y pega este HTML (reemplaza `TU_URL_LOGO_AQUI` con la URL de Cloudinary que guardaste):

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
      <img src="TU_URL_LOGO_AQUI" alt="MUROS" class="logo" />
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
      <p>Este correo fue enviado por <strong>MUROS</strong></p>
      <p>Si tienes preguntas, contacta a: <a href="mailto:info@murosnegocios.com" style="color: #f07e0e;">info@murosnegocios.com</a></p>
      <p style="margin-top: 10px; color: #999;">© 2025 MUROS. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

**⚠️ IMPORTANTE:** Reemplaza `TU_URL_LOGO_AQUI` con la URL de Cloudinary que guardaste en el Paso 1.

### 6.4 Guardar la Plantilla

1. Haz clic en **Save** (Guardar)
2. Los cambios se aplicarán inmediatamente

---

## 🖼️ PASO 7: Configurar Avatar/Imagen de Perfil del Remitente (Logo en Gmail/Outlook)

### 7.1 Entender Cómo Funciona

La imagen de perfil que aparece en Gmail, Outlook y otros clientes de correo se llama **"Brand Logo"** o **"Sender Logo"**. Firebase **NO controla esto directamente**, pero puedes configurarlo usando **BIMI** (Brand Indicators for Message Identification).

### 7.2 Configurar BIMI para Mostrar Logo en Gmail/Outlook

**BIMI** es un estándar que permite mostrar tu logo junto a tus correos en clientes compatibles (Gmail, Yahoo, Outlook, etc.).

#### 7.2.1 Preparar el Logo para BIMI

1. El logo debe ser:
   - Formato: **SVG** (recomendado) o PNG
   - Tamaño: 200x200 píxeles mínimo
   - Fondo: Transparente o sólido
   - Sin texto (solo el logo)

2. Si tienes el logo en PNG (`favIcon.png`):
   - Conviértelo a SVG usando: https://convertio.co/png-svg/ o similar
   - O usa un servicio como: https://www.vectorizer.io/

3. Sube el logo SVG a Cloudinary:
   - Sube el archivo SVG
   - Copia la URL pública
   - **Guarda esta URL**

#### 7.2.2 Configurar Registro BIMI en Hostinger

1. En Hostinger, ve a **DNS / Zona de nombres**
2. Haz clic en **Agregar registro**
3. Tipo: **TXT**
4. **Nombre/Host:** `default._bimi`
5. **Valor/Contenido:**
   ```
   v=BIMI1; l=TU_URL_LOGO_SVG_AQUI; a=https://murosnegocios.com;
   ```
   Reemplaza `TU_URL_LOGO_SVG_AQUI` con la URL del SVG de Cloudinary
6. **TTL:** 3600
7. Guarda

**Ejemplo completo:**
```
v=BIMI1; l=https://res.cloudinary.com/dthp8pdsa/image/upload/v1234567890/logo.svg; a=https://murosnegocios.com;
```

#### 7.2.3 Verificar BIMI

1. Espera 24-48 horas para propagación
2. Verifica en: https://bimigroup.org/bimi-generator/
3. Envía un correo de prueba y verifica en Gmail/Outlook

**⚠️ NOTA:** BIMI requiere que tengas:
- ✅ SPF configurado
- ✅ DKIM configurado  
- ✅ DMARC con política `quarantine` o `reject` (no solo `none`)
- ✅ Certificado VMC (opcional pero recomendado para Gmail)

### 7.3 Configurar DMARC Correctamente (Requerido para BIMI)

1. En Hostinger, ve a **DNS / Zona de nombres**
2. Haz clic en **Agregar registro**
3. Tipo: **TXT**
4. **Nombre/Host:** `_dmarc`
5. **Valor/Contenido:**
   ```
   v=DMARC1; p=none; rua=mailto:info@murosnegocios.com; ruf=mailto:info@murosnegocios.com; sp=none; aspf=r;
   ```
6. **TTL:** 3600
7. Guarda

**Explicación:**
- `p=none`: No bloquea correos que fallen (modo de prueba)
- `rua`: Email para reportes agregados
- `ruf`: Email para reportes de fallos

### 7.3 Alternativa: Usar Google Workspace (Avanzado)

Si quieres control total sobre el remitente y avatar:
1. Configura Google Workspace con tu dominio
2. Usa Cloud Functions para enviar correos personalizados
3. Esto requiere configuración avanzada

---

## ✅ PASO 8: Verificar Configuración

### 8.1 Verificar Dominio en Firebase

1. En Firebase Console, ve a **Authentication** > **Settings** > **Authorized domains**
2. Verifica que `murosnegocios.com` aparezca como **Verified** (Verificado)
3. Si dice "Pending" (Pendiente), espera a que se propague el DNS

### 8.2 Verificar Registros DNS

Usa estas herramientas para verificar:
- **SPF:** https://mxtoolbox.com/spf.aspx
- **DKIM:** https://mxtoolbox.com/dkim.aspx
- **DMARC:** https://mxtoolbox.com/dmarc.aspx

Ingresa `murosnegocios.com` en cada herramienta.

### 8.3 Probar el Restablecimiento de Contraseña

1. En la app, usa "Olvidé mi contraseña"
2. Revisa el correo recibido
3. Verifica que:
   - ✅ El diseño se vea correcto
   - ✅ El logo aparezca
   - ✅ Los colores sean de MUROS (#f07e0e)
   - ✅ El texto esté en español
   - ✅ El correo NO vaya a spam

---

## 🐛 Solución de Problemas

### El dominio no se verifica en Firebase

**Solución:**
1. Verifica que el registro TXT esté correcto en Hostinger
2. Espera 24-48 horas para propagación completa
3. Usa https://dnschecker.org/ para verificar propagación global
4. Asegúrate de que el registro TXT tenga el valor exacto de Firebase

### Los correos siguen yendo a spam

**Solución:**
1. Verifica que SPF esté configurado correctamente
2. Verifica que DKIM esté configurado
3. Configura DMARC (Paso 7.2)
4. Pide a los usuarios que marquen como "No spam"
5. Espera unos días para que mejore la reputación del dominio

### El logo no aparece en el correo

**Solución:**
1. Verifica que la URL de Cloudinary sea accesible públicamente
2. Asegúrate de usar `https://` en la URL
3. Prueba la URL directamente en el navegador
4. Si usas Cloudinary, asegúrate de que el archivo sea público

### No puedo cambiar el remitente a info@murosnegocios.com

**Solución:**
- Firebase usa `noreply@[tu-proyecto].firebaseapp.com` por defecto
- Para usar `info@murosnegocios.com`, necesitarías:
  1. Configurar Google Workspace
  2. O usar Cloud Functions con un servicio de email (SendGrid, Mailgun)
- Esto es una limitación de Firebase Auth

---

## 📝 Checklist Final

Antes de terminar, verifica que tengas:

- [ ] Logo subido a Cloudinary y URL guardada
- [ ] Dominio `murosnegocios.com` agregado en Firebase
- [ ] Registro TXT de verificación agregado en Hostinger
- [ ] Registro SPF configurado en Hostinger
- [ ] Registros DKIM agregados en Hostinger
- [ ] Plantilla de email personalizada en Firebase
- [ ] Logo agregado en el HTML del email
- [ ] Dominio verificado en Firebase Console
- [ ] Probado el restablecimiento de contraseña
- [ ] Verificado que el correo no va a spam

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Firebase Console
2. Verifica los registros DNS con las herramientas mencionadas
3. Contacta a Hostinger si hay problemas con DNS
4. Revisa la documentación de Firebase: https://firebase.google.com/docs/auth

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tus correos de Firebase:
- ✅ Tendrán el branding de MUROS
- ✅ Estarán en español
- ✅ No irán a spam (o irán menos)
- ✅ Tendrán el logo visible
- ✅ Usarán tu dominio personalizado

**Tiempo estimado total:** 2-4 horas (incluyendo propagación DNS)

