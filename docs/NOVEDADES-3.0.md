# AK Screen 3.0

Herramientas de animación, análisis de movimiento, audio y colaboración integradas
en la misma línea de tiempo. Los resultados editables se guardan con el proyecto.

## Movimiento y composición

- **Seguimiento de objetos:** marca una región en Program, analiza posición,
  rotación o escala y vincula otra capa a la trayectoria. Se detiene con un error
  si pierde el objeto, sin aplicar una trayectoria incompleta.
- **Estabilización:** analiza movimiento y genera correcciones editables, con
  suavizado y ampliación para ocultar bordes.
- **Audio a animación:** convierte amplitud general o bandas de graves, medios y
  agudos en claves de escala, rotación, opacidad u otras propiedades escalares.
  Permite analizar un clip de audio o la mezcla de la secuencia.
- **Espectros musicales:** barras y disposición circular, de 4 a 64 bandas,
  colores, altura, radio, ataque y liberación. Cada banda es una capa vectorial
  con claves editables, visible en Program y en la exportación.
- **Partículas 2D:** emisor, semilla, vida, velocidad, dirección, dispersión,
  gravedad, viento, turbulencia, resistencia y colisión con suelo. Colores inicial
  y final, tamaño, forma y restitución. Render determinista al mover el cabezal.
- **Cámara con objetivo:** apunta a una coordenada X/Y/Z o sigue el centro de una
  capa animada. Usa la cámara de composición 3D y admite claves.
- **Desenfoque de movimiento:** obturación y de 2 a 16 muestras temporales por
  fotograma; incluye cámara, planos 3D, texto y opacidad. Más muestras aumentan el
  tiempo de render.
- **Motion Design:** oscilación orgánica, rebote amortiguado, pulso, entrada de
  opacidad, repetición y ping-pong, con escalonamiento entre clips.
- **Repetidores:** distribuye copias de capas en línea, cuadrícula o círculo;
  controla separación, escala, rotación, opacidad y retardo conservando las claves.
- **Trayectorias por puntos:** recorrido a velocidad uniforme, orientación y
  cierre opcional. Herramientas para invertir, escalar, desplazar o cuantizar
  claves, con Ease In/Out, lineal y Hold.

Los análisis trabajan en segundo plano, se pueden cancelar y se aplican como una
operación de deshacer. Si se cambia la secuencia durante el análisis, se conserva
la edición y se pide repetir el análisis.

## Texto y fuentes

- Animación individual por carácter: posición, escala, rotación, opacidad,
  selección de un intervalo, orden inverso y desfase. Progreso automático o por
  claves; compatible con degradados y estilos de texto existentes.
- Máquina de escribir por caracteres Unicode o palabras, y contadores con
  decimales, prefijo, sufijo y duración.
- Selector con búsqueda para texto y subtítulos. Fuentes integradas, fuentes del
  sistema e importación persistente de archivos TTF, OTF y TTC. No modifica las
  fuentes instaladas en el sistema operativo.
- La duración de un gráfico o título ya no cambia por error su posición de
  inserción: se coloca en el cabezal o en el tiempo indicado.
- Guardado y reapertura con lectura precisa de los valores decimales de claves y
  geometría, sin la pérdida de precisión detectada en los espectros.

## Biblioteca y colaboración

- Login individual con GitHub mediante código de dispositivo. Cada colaborador
  envía archivos a su fork y un pull request al catálogo oficial. No se distribuye
  una credencial compartida; las descargas públicas no requieren login.
- Borradores locales con autoguardado, reapertura y creación de una nueva versión
  conservando el aporte anterior.
- Seguimiento de pull requests: en revisión, aceptado o cerrado sin aceptar.
  Actualización del estado desde GitHub con la cuenta del autor.
- Galería de efectos con categorías y subcategorías desplegables. Descargas
  comunitarias agrupadas por paquete y tipo, con las vistas previas del catálogo.
- Lista/Galería respeta la selección del usuario; el tema establece el valor
  inicial y se puede restablecer. Apertura de rutas y selección de archivos en su
  ubicación real.

## Agentes

- [AK Screen MCP](https://github.com/Edgajuman/AKScreen-MCP): comandos, inspección,
  edición, vista previa, trabajos y deshacer desde clientes compatibles con stdio.
- [Skill AK Screen Editing](https://github.com/Edgajuman/AKScreen-Skill): flujo de
  trabajo para descubrir comandos, preservar el proyecto y verificar ediciones.
- Compatibilidad desde AK Screen 3.0. El control local se activa expresamente,
  escucha solo en loopback y autentica cada solicitud con una clave de sesión.

## Alcance

El seguimiento requiere detalle visible y un intervalo sin cortes. No es una
herramienta de reconocimiento semántico ni rotoscopia con IA. La estabilización
estima movimiento global; no reconstruye zonas fuera de la imagen.

Las partículas son simulación 2D con suelo, no cuerpos rígidos ni colisiones entre
objetos. La composición 3D utiliza planos y cámaras; no importa proyectos ni plugins
de After Effects. Las animaciones generadas se materializan en claves o capas.
Las fuentes importadas deben estar disponibles también en el equipo que abra el
proyecto.

Límites de análisis: hasta 10 000 fotogramas para seguimiento y hasta 300 segundos
de audio, sujetos al límite total de claves. Cada proceso informa si es necesario
reducir duración, FPS o bandas.


## Plataformas
Windows x64 y Linux x64 disponibles. **macOS 3.0: en desarrollo.** Las versiones anteriores permanecen disponibles.
