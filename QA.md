# Validación de Contrapeso

Revisión del 23 de octubre de 2026.

## Pruebas automatizadas

- 23 pruebas aprobadas, sin fallos.
- Enumeración independiente de 2.928 distribuciones entre los seis móviles: una única solución para cada uno.
- Colocación, intercambio, retirada, deshacer, pista, progreso y borradores por capítulo.
- Datos ilegibles, almacenamiento bloqueado y protección frente a cambios de otra pestaña.
- Cancelación y confirmación de operaciones de reinicio y borrado.
- Recursos locales, importaciones, IDs HTML y ausencia de solicitudes automáticas remotas.

## Navegador

- Los seis móviles se resolvieron consecutivamente mediante controles visibles, en 4, 4, 6, 6, 6 y 6 movimientos.
- Victoria 6/6 y progreso conservado al recargar.
- Enter y Espacio colocan; Escape cancela selección; Supr retira; Deshacer restaura.
- Cancelar el reinicio conserva el tablero; confirmar lo reinicia. Cancelar el borrado conserva el progreso.
- Vistas de 320 y 390 px sin desbordamiento horizontal ni solapamientos observados. Las barras se apilan en la vista estrecha.
- El conflicto entre pestañas se detectó y solicitó recarga sin sobrescribir el progreso.

## Límites

Las pruebas automatizadas del controlador usan un doble de DOM y no sustituyen al navegador. La revisión visual usa un navegador de escritorio con vistas estrechas; no certifica un dispositivo táctil físico, lectores de pantalla, zoom al 200 % ni todos los navegadores. El despliegue de producción debe comprobarse por separado después de publicar.
