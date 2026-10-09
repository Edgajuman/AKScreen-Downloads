# Temas y apariencia

Abre **Temas** para seleccionar una paleta o entrar en el **Catálogo**. Pulsa **Actualizar**, revisa la vista previa y elige **Instalar y aplicar**. Sakura Pulse incluye fondos, iconos SVG y una fuente; Aurora Glass ofrece una paleta violeta; AK Midnight es la plantilla nativa de ejemplo.

[Catálogo web con descargas](https://edgajuman.github.io/AK-Screen-Themes/) · [Guía para crear un tema](https://github.com/Edgajuman/AK-Screen-Themes/blob/main/CONTRIBUTING.md) · [Todos los campos compatibles](https://github.com/Edgajuman/AK-Screen-Themes/blob/main/SCHEMA.md)

## Archivos por autor

```text
Documentos/AK Screen/Temas/
└── autor/
    └── tema/
        ├── theme.json
        ├── preview.png
        ├── info.md y licencias
        └── assets/ (fondos, SVG y fuentes)
```

Cada usuario del equipo usa su propia carpeta Documentos. Dentro de Temas, cada creador tiene su carpeta de autor. La instalación verifica tamaño y SHA-256 de los componentes; no ejecuta scripts. Los temas instalados funcionan sin conexión. Al reinstalar, el paquete anterior se conserva como copia de recuperación.

Puedes cambiar la ubicación y el repositorio en **Ubicación y repositorio**. El catálogo predeterminado es `Edgajuman/AK-Screen-Themes`. Para trasladarlo, copia el repositorio de temas y su workflow, publícalo y cambia el campo `propietario/repositorio`. El historial de versiones de la aplicación sigue separado en el repositorio de descargas.

## Fondos y pantalla de inicio

En **Fondo del editor y pantalla de inicio** selecciona PNG/JPEG/GIF/WebP y ajusta la opacidad de 0 a 100%. Los GIF y WebP animados conservan la animación dentro de límites de memoria. Puedes usar el fondo del tema o uno personal.

La pantalla de carga admite un fondo independiente, una duración mínima de 0,5–6 segundos y un interruptor para desactivarla. Los fondos decoran la interfaz y no aparecen en el vídeo exportado.

## Crear y compartir

**Exportar paleta** guarda los 38 colores y medidas actuales en un JSON. Cambia id, nombre, autor y versión; añade recursos siguiendo la plantilla AK Midnight del repositorio de temas. Los SVG sustituyen iconos nativos; las TTF/OTF se cargan solo dentro de la aplicación y conservan fuentes de respaldo.

Haz un fork de AK-Screen-Themes, añade `themes/tu-usuario/tu-tema/` y abre un pull request. Solo al aceptarlo en main se generan el catálogo, los ZIP y la página web. Los PR abiertos y los forks no aparecen en el catálogo oficial.

Para instalar manualmente un ZIP de la web, extráelo y selecciona su theme.json con **Importar paquete / JSON**. No muevas el JSON sin sus carpetas de componentes.

El formato anterior se convierte automáticamente. Las antiguas animaciones declarativas y texturas de widgets se conservan como recursos, pero todavía no se aplican en el editor Rust. La guía del esquema distingue las funciones activas.
