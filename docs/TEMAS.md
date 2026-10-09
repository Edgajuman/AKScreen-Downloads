# Temas de AK Screen

Abre **Temas → AK Midnight** para probar el ejemplo incluido. **Exportar tema**
guarda los 15 colores editables de la paleta actual. Modifica el JSON, cambia
`id` y `name`, e impórtalo con **Importar JSON**. Después selecciónalo en la lista.

Los colores usan `#RRGGBB`. `schema: 1` identifica el formato y `base` puede ser
`dark`, `medium`, `light`, `studioBlue` u `oled`. El archivo
[`ak-midnight.json`](../themes/ak-midnight.json) es un ejemplo completo.

| Campo de colors | Elemento |
|---|---|
| accent | Selección activa, foco y cabezal de reproducción |
| background | Fondo general |
| header | Cabeceras |
| panel | Paneles y línea de tiempo |
| tabs | Pestañas |
| text | Texto principal |
| secondary | Texto secundario e iconos |
| field | Campos de edición |
| border | Bordes y separadores |
| selection | Filas seleccionadas |
| track / trackAlternate | Fondos alternos de pistas |
| monitor | Fondo del visor |
| hover | Resaltado al pasar el mouse |
| danger | Errores y acciones destructivas |

La carpeta predeterminada es `Documentos/AK Screen/Temas`. Cambiarla en **Temas**
permite usar otra ubicación sin cambiar el código. Los temas son datos, no plugins.

## Publicar un catálogo

En cualquier repositorio público de GitHub crea `themes.json` en `main`:

```json
{
  "schema": 1,
  "themes": [
    {
      "schema": 1,
      "id": "mi-azul",
      "name": "Mi azul",
      "base": "dark",
      "colors": { "accent": "#408CFF", "panel": "#171F2D" }
    }
  ]
}
```

Los colores omitidos heredan la paleta base. Configura `propietario/repositorio`
en **Repositorio del catálogo** y pulsa **Importar catálogo de GitHub**.
El catálogo inicial es `Edgajuman/AKScreen-Downloads`. Para trasladarlo más
adelante, copia el JSON al nuevo repositorio y cambia ese campo en la aplicación.
No hacen falta servidor, cuentas de usuario ni una API propia.

Los paquetes con formatos, colores o campos no compatibles se rechazan.
Mantén identificadores únicos; una importación con el mismo `id` actualiza ese tema.
