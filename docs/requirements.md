# Requisitos técnicos y desarrollo local

## Entorno

- Node.js >=22.22.0 compatible con Astro 7. Entorno verificado: Node.js 24.21.0.
- npm y Git. Las versiones exactas de las dependencias están fijadas en `package-lock.json`; utilizar `npm ci`.
- Windows, macOS o Linux con un navegador moderno y Canvas, File API y Web Workers.
- Las plantillas no requieren WebGPU ni descargar pesos de IA.
- La IA requiere contexto seguro (HTTPS o localhost), WebGPU con adaptador compatible, OPFS y varios GB de almacenamiento y memoria disponibles. No hay un mínimo universal de GPU garantizado. La descarga inicial ronda 3,3-5 GB.
- Conexión inicial para instalar dependencias y, si se elige IA, descargar el modelo. No se requieren claves, base de datos ni servidor de inferencia.

## Instalar y arrancar

Desde la carpeta del repositorio:

```sh
npm ci
npm run dev
```

Abrir `http://127.0.0.1:4321/es/` o `/en/`. `predev` prepara automáticamente los recursos locales y sus avisos de licencia. No descarga los pesos del modelo.

Copiar `.env.example` a `.env` para configurar `SITE_URL` antes de una compilación de producción. `.env` no se publica en Git. `PUBLIC_MODEL_BASE_URL` es una URL pública opcional para un espejo del modelo; cualquier variable `PUBLIC_` es visible para el visitante y nunca debe contener secretos.

## Verificar y previsualizar producción

```sh
npm run check
npm test
npm run build
npm run serve
```

La previsualización de producción abre `http://127.0.0.1:4322/es/` con las cabeceras necesarias para aislamiento entre orígenes. No es un servidor público de producción. Consultar [pruebas](testing.md) para validar interacciones, ZIP y generación real con GPU.

## Mapa de código

| Ruta | Responsabilidad |
| --- | --- |
| `src/pages/`, `src/layouts/` | Páginas Astro, idiomas, metadatos y tema |
| `src/components/Editor.tsx` | Flujo del editor y resultados |
| `src/lib/project.ts` | Estado, límites y validación |
| `src/lib/render.ts`, `phone.ts`, `template-design.ts` | Composición, dispositivos y plantillas |
| `src/lib/ai*`, `model-*` | Dirección creativa, inferencia y caché local |
| `src/lib/encode.worker.ts`, `export.ts` | PNG RGB y empaquetado ZIP |
| `public/hero/` | Ejemplos localizados producidos con el editor |
| `scripts/` | Preparación, servidor local e inspección de exportaciones |
| `tests/` | Pruebas unitarias y flujos de navegador |

`node_modules/`, `dist/`, `.astro/`, `output/` y `public/runtime/` son recursos instalados o generados y se excluyen de Git. No incluir perfiles del navegador, cachés de pesos, capturas particulares ni resultados de pruebas. Los recursos necesarios se regeneran desde el lockfile.

## Resolver problemas

Si el puerto está ocupado, cerrar únicamente el servidor propio que ya no se utilice o configurar otro puerto de Astro. Si falla la descarga del modelo, revisar espacio disponible, conectividad y el diagnóstico del editor. La navegación privada puede limitar OPFS. Para borrar los pesos utilizar el control del editor o la configuración del navegador. Ante una GPU incompatible, seleccionar explícitamente las plantillas. Recargar pierde el proyecto de la sesión.
