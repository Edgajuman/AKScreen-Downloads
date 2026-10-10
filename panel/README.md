# AK Screen · panel de publicaciones

Panel: <https://edgajuman.github.io/AKScreen-Downloads/panel/>

La interfaz estática vive en `AKScreen-Downloads`, porque el plan de GitHub de esta cuenta no admite Pages desde el repositorio privado. El contenido y las credenciales siguen en `AKScreen-Control`, que permanece privado.

## Primera conexión

Crea un Fine-grained personal access token de GitHub, con vencimiento y alcance solo para:

- `AKScreen-Control`: permiso **Contents — Read and write**.
- `AKScreen-Builds`: permiso **Actions — Read and write** para iniciar la sincronización firmada al publicar.

Inicia sesión como `Edgajuman`, escribe la clave del panel y pega el token. Por defecto el token vive solo en memoria hasta bloquear o cerrar la página. La opción de recordar lo cifra localmente con AES-GCM y una clave derivada de la contraseña. Se puede borrar desde la pantalla de acceso.

La contraseña solo bloquea la interfaz pública. GitHub comprueba la identidad, el acceso al repositorio privado y los permisos del token: nunca se incorpora ningún token al código del sitio. El panel estático no sustituye un servidor de autenticación; si necesitas revocar acceso, revoca el token en la configuración de GitHub.

## Publicar

1. Pulsa `+`, escribe el anuncio y selecciona la categoría.
2. Redacta en Markdown. Los medios adjuntos insertan su enlace y se guardan junto con el aviso; se admiten PNG, JPG, WebP, GIF, MP4, WebM y MOV, hasta 15 MB por archivo y 50 MB por aviso.
3. Usa **Guardar borrador** para dejarlo privado o **Publicar / actualizar** para guardarlo y solicitar la validación y firma de GitHub Actions.
4. La campana de AK Screen recibe el aviso cuando termina la acción; también puede pulsarse **Sincronizar ahora** para reintentar. **Retirar** quita un aviso del canal en la siguiente sincronización.

El publicador valida manifiestos, hashes y medios antes de firmarlos. La interfaz no ejecuta HTML o JavaScript de anuncios. Los instaladores y cambios de ejecutable siguen requiriendo una release y compilación.
