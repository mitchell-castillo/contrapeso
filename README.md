# Contrapeso

Seis puzles originales de equilibrio, sin reloj. Juego 006 de Daily Games, 23 de octubre de 2026.

- Jugar: https://mitchell-castillo.github.io/contrapeso/
- Colección: https://mitchell-castillo.github.io/daily-games/

## Cómo jugar

Cuelga todos los pesos y equilibra las tres barras. En cada rama, la suma de **peso × distancia** a la izquierda del apoyo debe igualar la de la derecha. La barra superior usa el peso total de cada rama multiplicado por su brazo. Las barras y cuerdas no pesan. Las distancias impresas son la regla; la ilustración no está a escala.

1. Selecciona un peso y después un gancho.
2. Selecciona un peso colgado para moverlo o intercambiarlo.
3. Sin peso seleccionado, activa un gancho ocupado para retirarlo.

Tab recorre los controles; Enter o Espacio los activa. Las flechas recorren ganchos; Supr o Retroceso retira un peso; Escape cancela la selección; Z deshace. Las pistas no cambian el tablero ni suman movimientos. Reiniciar un móvil o borrar el progreso requiere confirmación.

Los seis capítulos están abiertos. El juego conserva los borradores de cada móvil, la partida activa y la mejor marca de movimientos al resolverlo. Deshacer y reiniciar un móvil conservan sus marcas obtenidas. Borrar el progreso afecta solo a Contrapeso.

## Desarrollo y comprobaciones

No hay dependencias ni compilación. Requiere Node.js 20 o superior para las herramientas; la página publicada es estática.

```sh
npm start
# Abrir http://127.0.0.1:4173
node --test
node tools/check-static.mjs
```

El workflow de GitHub Actions ejecuta sintaxis, las 23 pruebas y la comprobación de recursos estáticos en cada push y pull request. No usa secretos. GitHub Pages sirve main desde la raíz del repositorio; las importaciones son relativas y compatibles con /contrapeso/.

Las pruebas comprueban equilibrio, solución única por enumeración completa, acciones del controlador, guardado, recuperación de datos inválidos, confirmaciones y conflicto entre pestañas. Consulta [QA.md](QA.md) para el alcance y los límites de la revisión.

## Accesibilidad y privacidad

HTML en español, controles nativos, foco visible, regiones de estado y etiquetas con rama, lado, distancia y peso. El equilibrio también se expresa en texto y números, no solo con color. El diseño apila las ramas en pantallas estrechas.

No hay cuentas, analítica, cookies de seguimiento, audio, fuentes remotas ni solicitudes automáticas a servicios externos. Solo se guarda localmente con la clave `daily-games:contrapeso:v1`. El catálogo puede leer las marcas porque ambos comparten origen en GitHub Pages. No hay sincronización entre dispositivos; borrar datos del navegador puede eliminar el avance.

Si el almacenamiento falla, se permite seguir jugando con un aviso. Si otra pestaña modifica el progreso, se suspenden nuevas escrituras hasta recargar para evitar sobrescribirlo.

## Originalidad

Contrapeso es un puzle de asignación de masas y momentos con tres restricciones simultáneas. No repite rutas inerciales, reflejos de faro, gestión de cultivos, cambios de vías ni memoria de secuencias de los cinco juegos anteriores. La comparación se refiere a esta colección, no a la ausencia de precedentes del concepto físico de una balanza.
