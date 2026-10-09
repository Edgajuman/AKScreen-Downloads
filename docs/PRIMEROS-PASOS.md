# De una grabación a un tutorial

## 1. Grabar

Abre **Capturar → Grabar tutorial**, escribe el nombre y elige un monitor, el escritorio
completo o una región por coordenadas. Activa cursor simulado, zoom y texto según
lo que necesites. **Iniciar grabación** deja tres segundos para preparar la ventana.

Durante la captura, **Ctrl+Shift+F9** pausa o continúa y **Ctrl+Shift+F10** detiene.
En Windows también puedes usar los controles flotantes. Por defecto se excluyen
del video y sus clics no crean destinos para el cursor simulado. Ambas opciones
se pueden cambiar en **Configuración → Grabación, audio y cursor → Controles flotantes**.

## 2. Seleccionar una tabla en Excel

En **Cámara**, activa **Mantener zoom y seguir al arrastrar**. Mantén pulsado el
botón izquierdo mientras seleccionas las celdas. El encuadre permanece ampliado
y sigue el mouse. Al soltar, espera la permanencia configurada y vuelve
suavemente al encuadre original.

Prueba una ampliación de **1,6×**, entrada de **600 ms** y salida de **800 ms**.
Son puntos de partida; el encuadre se puede ajustar después en el editor.

## 3. Escribir una explicación

Activa **Texto con atajo** antes de grabar. Pulsa **Ctrl+K**, escribe y vuelve a
pulsarlo para cerrar ese texto. El atajo es configurable. La escritura también
llega a la aplicación que estás demostrando: úsalo cuando no estés sobre un
campo donde no quieras escribir, o añade el texto posteriormente en el editor.

Al terminar, selecciona **Texto en pantalla**. En **Gráficos** cambia el contenido,
fuente, color y fondo. Mueve o recorta el clip para decidir cuándo aparece;
ajusta su posición y opacidad desde los controles del editor.

## 4. Editar la cámara y los clics

Al detener la grabación se crea una secuencia con el video y sus capas. Los
clips **Cámara**, **Clic**, **Cursor**, **Halo del cursor** y **Texto en pantalla**
se pueden seleccionar en la línea de tiempo. Desplázalos, cambia su duración y
edita sus fotogramas clave para ajustar el movimiento y la ampliación.

Las pulsaciones cercanas pueden compartir un clip de cámara para mantener
un movimiento continuo. Guarda el proyecto antes de experimentar; el editor
permite deshacer los cambios.

## 5. Capturar una interfaz

Abre **Capturar → Capturar interfaz**, elige la ventana y **Capturar e importar capas**.
En Windows, los controles que exponga su accesibilidad se convierten en imágenes
independientes. Puedes moverlos, escalarlos y animarlos. Su texto interno sigue
siendo una imagen. Si la ventana no expone controles, se importa una captura completa.

## 6. Exportar y conservar versiones

Usa **Archivo → Exportar → Medios** y elige H.264/MP4. Los proyectos, eventos,
capturas y preferencias se guardan en el equipo. **Capturar → Proyectos de captura** permite renombrar
y enviar proyectos a la Papelera de AK Screen.

La campana muestra el historial de versiones y sus descargas. **Descargar**
comprueba el SHA-256 antes de ofrecer **Abrir instalador**. Puedes conservar
varias versiones de Windows eligiendo rutas diferentes. Haz una copia del
proyecto antes de abrirlo con una versión anterior.

## 7. Personalizar el editor

En **Configuración → Temas y catálogo** instala un paquete del Catálogo o selecciona una paleta. **Fondo del editor y pantalla de inicio** permite elegir imágenes o animaciones GIF/WebP, ajustar opacidad y configurar la pantalla de carga. [Guía completa de temas](TEMAS.md).

## 8. Audio y subtítulos

En **Configuración → Grabación, audio y cursor** elige micrófono y, en Windows, audio del sistema. Se conservan en pistas separadas y siguen el reloj de pausa. Comprueba los dispositivos antes de una grabación larga.

Abre **Herramientas → Subtítulos automáticos**. Elige toda la secuencia, una pista o los clips de audio seleccionados, y el idioma. Si falta el modelo, pulsa **Descargar modelo** después de revisar tamaño y licencia. El modelo permanece en la caché del usuario para otras versiones compatibles; no viene dentro del instalador. Revisa el texto antes de insertarlo como clips de subtítulos.

## 9. Motion y composición

En **Herramientas → Animación, capas y efectos** aplica presets de entrada, giro, pulso o rebote a los clips seleccionados. Puedes modificar sus fotogramas, duración y curva. Vincula capas a un control para animarlas juntas, elige anclaje o alinea la selección.

**Composición 2.5D** coordina profundidad, giro y cámara para parallax. Las formas 3D procedurales se crean desde Efectos y admiten material, luz y animación. El modo 3D actual trabaja con primitivas; no importa escenas externas ni incluye sombras entre objetos.

Selecciona un clip en Programa para mover, escalar o rotar mediante sus controles. Arrastra las pestañas de los paneles para reagruparlos o dividir el espacio. Guarda o restaura la disposición desde Espacios de trabajo.

## 10. Atajos y preferencias

**Configuración → Ajustes generales** abre las preferencias del editor. **Atajos de teclado** permite buscar acciones, detectar conflictos y reasignar combinaciones. Los atajos de pausa, parada y escritura se ajustan en Grabación.

## Requisitos prácticos

- Windows x64; captura entre 15 y 120 FPS objetivo, según el rendimiento del equipo.
  60 FPS y calidad JPEG 95 son los valores iniciales de nuevas preferencias.
  Las preferencias de instalaciones anteriores se conservan; puedes modificarlas.
- Linux x64: Ubuntu 24.04 o compatible. El registro global de acciones requiere
  X11; la captura en Wayland depende del escritorio.
- macOS: permisos de grabación de pantalla y accesibilidad. Paquetes separados
  para Intel y Apple Silicon; firma ad hoc, sin notarización comercial.
- Los instaladores no llevan un certificado comercial de firma de código.

La edición y la grabación funcionan localmente. Las consultas de versiones,
descargas y catálogos de temas opcionales necesitan acceso HTTPS a GitHub.
