# Guía de tematización por modelo

Este documento resume la arquitectura aplicada al frontend para que cada modelo entrenado con archivos propios proyecte su identidad visual y para que el modo **DeepThink** siga siendo opcional.

## 1. Catálogo de modelos
- El archivo `components/chat/modelThemes.ts` define `MODEL_LIBRARY` con todos los modelos disponibles y el color que representa los archivos que se cargaron en cada uno (pitch decks, playbooks, documentos operativos, etc.).
- Cada entrada incluye `summary` para explicar brevemente el contenido cargado.
- El modelo "AIx General" es el que se usa por defecto; no mostramos un estado "default", sino el nombre del modelo activo.
- El botón “Agregar nuevo modelo” del selector abre un placeholder (por ahora solo `console.info`) para que, cuando se implemente el backend, se despliegue un formulario que permita subir los archivos y definir el color de marca.

## 2. Paletas dinámicas
- `modelThemes.ts` exporta helpers (`buildThemeFromHex`, `getModelPalette`) que generan una paleta completa a partir de un color base.
- La paleta controla:
  - El **background** negro con el difuminado del color del modelo.
  - Los paneles del chat y del compositor.
  - Bordes, pills y gradientes de botones (enviar, DeepThink y selector de modelos).
- El componente `ModelSelector.tsx` reutiliza la paleta para pintar el botón del menú y para mostrar una vista previa en cada opción.
- El usuario puede elegir un color personalizado (`input type="color"`); esto selecciona automáticamente el modelo “Personalizado” y recalcula la paleta.

## 3. DeepThink como modo opcional
- `activeMode` inicia en `'default'`, por lo que el botón DeepThink aparece deseleccionado.
- Al activarlo se ejecuta `syncModeChange`, que es el lugar indicado para disparar la llamada al backend encargada de habilitar la cadena de razonamiento profundo.
- Si se vuelve a hacer clic, el modo regresa a `'default'`, manteniendo al usuario en el modelo general.

## 4. Cómo extender la solución
1. Agregar un nuevo modelo: añadirlo a `MODEL_LIBRARY` con su `accentHex` y resumen.
2. (Opcional) Crear un preset adicional en `THEME_PRESETS` si deseas un nombre fijo para ese color.
3. Conectar `handleAddModel` a un modal o flujo de onboarding que suba archivos al almacenamiento correspondiente.
4. Enviar `selectedModelId` al backend dentro de la carga útil de cada prompt para que el servicio de inferencia sepa qué archivos/embedding usar.

Con este enfoque mantenemos el fondo negro con el color del AI difuminado, dejamos el logo siempre azul para respetar la marca y permitimos que cada modelo cargado con archivos propios cambie por completo la experiencia visual del chat.
