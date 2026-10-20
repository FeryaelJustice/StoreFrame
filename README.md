# StoreFrame

Generador gratuito de capturas para Google Play y App Store. Web estática en español e inglés, sin cuentas, sin claves de API y sin backend de inferencia. Desarrollado por Feryael Justice.

La documentación técnica se encuentra en [docs/](docs/README.md): [requisitos y desarrollo local](docs/requirements.md), [despliegue profesional](docs/deployment.md), arquitectura, pruebas y licencias. Consulta también la [política de privacidad](PRIVACY.md) y las [instrucciones de mantenimiento para agentes](AGENTS.md).

## Ejecutar

Requiere Node.js 22.22 o superior compatible con Astro 7, npm y un navegador moderno. El entorno de desarrollo utilizado es Node.js 24.21.0.

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:4321/es/ o http://127.0.0.1:4321/en/. La preparación inicial copia al directorio público los recursos locales de IA y sus licencias; no descarga pesos del modelo.

```sh
npm run check
npm test
npm run build
npm run serve
```

La última orden sirve `dist/` en http://127.0.0.1:4322/es/ con las cabeceras de aislamiento necesarias para los hilos de WebAssembly. `npm run preview` también previsualiza el sitio, pero un servidor sin esas cabeceras puede ejecutar ORT con un único hilo.

## Uso

1. Introducir un nombre de app opcional y seleccionar Android, iOS o ambos.
2. Elegir el móvil de Android y el de iOS en el paso de dispositivos. El marco se usa con y sin IA. Ver [modelos y referencias](docs/device-frames.md).
3. Elegir estilo y colores opcionales. Un color hexadecimal debe tener seis dígitos.
4. Añadir de 1 a 8 PNG, JPEG o WebP, ordenarlos y escribir un texto por captura.
5. Activar la IA opcional solo si se desea descargar y ejecutar el modelo.
6. Generar, revisar las previews y descargar el ZIP en la misma página.

La página empieza en modo oscuro. El botón del encabezado permite cambiar a claro y recuerda solo esa preferencia en este navegador. El tema de la página no cambia los PNG exportados.

Las plantillas sin IA dan protagonismo a tus colores: Limpio usa Primary uniforme; Degradado mantiene Primary dominante con Secondary desde un lateral; Editorial combina ambos en un campo diagonal con transición suave. Los textos ajustan su contraste según el fondo.

Cada imagen admite hasta 20 MiB y 24 megapíxeles. El lote admite 100 MiB. La captura se conserva completa dentro del dispositivo. Los textos que no caben de forma legible bloquean la exportación y deben acortarse. Un texto vacío es válido.

| Salida | Vertical | Horizontal |
| --- | --- | --- |
| Android | 1080 × 1920 | 1920 × 1080 |
| iPhone | 1320 × 2868 | 2868 × 1320 |

Los archivos son PNG RGB de 24 bits sin canal alfa. El ZIP solo contiene las plataformas seleccionadas, con rutas como `Android/mi-app_01.png` o `iOS/app_01.png`. Editar una opción o captura invalida el resultado anterior. No hay guardado de proyectos: recargar la página descarta la sesión.

## IA y costes

La IA usa FLUX.2 klein 4B con `flux-klein.js` 0.7.0. Tiene dirección creativa propia: inspiración automática, ondas y materiales, patrones geométricos o formas orgánicas. Puedes añadir una idea opcional. Una muestra abstracta de los colores de las capturas y tu paleta sirve de referencia local, sin interfaces reconocibles que el modelo pueda copiar. El nombre, los textos y la idea aportan contexto dentro del límite de instrucciones del motor. Cada generación usa una variación nueva y produce un fondo compartido de 512 × 512.

El fondo real se coloca a plena intensidad, sin recolorearlo ni lavarlo sobre una plantilla. Se adapta al formato de la store sin deformarlo. Después se añaden el móvil, la captura original y los textos; solo se suaviza el área del texto si hace falta para leerlo. Puedes desplegar el fondo original en los resultados. Limpio, Degradado y Editorial pertenecen únicamente al modo sin IA.

La descarga inicial ocupa aproximadamente 3,3-5 GB según los recursos y la caché existente. La IA usa el motor por streaming de la biblioteca también en ordenadores, para reducir los picos de memoria que pueden hacer que Chrome recargue la pestaña. Las fases de ONNX se ejecutan en workers desechables. WebGPU, almacenamiento OPFS y recursos suficientes son necesarios. No se promete funcionamiento en todas las GPU ni un tiempo fijo. Las plantillas locales están disponibles cuando la IA no es compatible o falla; nunca se etiquetan como IA.

No hay costes de inferencia de un proveedor: cada visitante usa su propio equipo, electricidad y conexión. El alojamiento gratuito y la distribución pública del modelo tienen sus límites. La versión está fijada y admite un espejo propio para reducir la dependencia del repositorio remoto.

## Configuración de despliegue

Copiar `.env.example` a `.env` y sustituir `SITE_URL` por el origen público real antes de compilar. Astro genera canonicals, alternates, sitemap y robots con ese origen. El dominio `storeframe.example` es únicamente un marcador de desarrollo.

`PUBLIC_MODEL_BASE_URL` permite seleccionar un espejo público del modelo. No debe contener secretos. Conservar la estructura y contenido de la revisión fijada en `src/lib/model-config.ts`.

La web no se publica automáticamente. Ver [despliegue](docs/deployment.md), [arquitectura](docs/architecture.md), [pruebas](docs/testing.md) y [licencias](docs/licenses.md).

## Privacidad y límites

Las imágenes y los textos permanecen en memoria durante la sesión. Los pesos de IA pueden persistir en OPFS y se pueden borrar desde el editor. El hosting de pesos recibe las conexiones de descarga, no las capturas. No se incluyen analítica, anuncios ni cookies propias.

Titular: Fernando Gonzalez Serrano. Contacto: nano9gs@hotmail.es. Las páginas informativas usan los datos facilitados. Antes de una publicación real, completar cualquier información identificativa adicional que corresponda al operador y comprobar que la política describe al proveedor de hosting elegido. No se ha realizado una certificación jurídica.

Esta versión cubre teléfonos. El marco de iPhone no convierte una UI Android en iOS. El usuario debe comprobar el contenido y los dispositivos exigidos por su ficha. Google Play pide al menos dos capturas para publicar; la herramienta permite generar una. Las especificaciones de las stores pueden cambiar.
