# Política de privacidad de StoreFrame

Última actualización: 20 de octubre de 2026.

## Responsable y contacto

Titular: Fernando Gonzalez Serrano. Contacto para consultas de privacidad: nano9gs@hotmail.es.

## Procesamiento en el navegador

Las capturas, textos, nombre de aplicación, colores e instrucciones creativas se procesan localmente. StoreFrame no incorpora endpoints para recibirlos ni los transmite a proveedores de IA. El proyecto permanece en memoria durante la sesión y se descarta al cerrar o recargar. La captura original se incorpora al resultado sin ser redibujada por el modelo.

Los archivos descargados permanecen en la ubicación que el usuario elige y StoreFrame no puede borrarlos.

## Almacenamiento local

La preferencia de tema se guarda en `localStorage` con la clave `storeframe-theme`. No se guardan proyectos ni capturas de forma persistente. Los pesos del modelo opcional pueden permanecer en OPFS, el almacenamiento privado del origen. Pueden eliminarse desde el editor o desde la configuración del navegador; el navegador también puede desalojarlos por falta de espacio.

## Conexiones externas

La interfaz y los recursos del motor se descargan del alojamiento de la web. La IA está desactivada inicialmente. Al activarla y generar, se descargan pesos desde Hugging Face y sus servidores de distribución, o desde el espejo público configurado por el operador. Estos proveedores pueden recibir la dirección IP y metadatos técnicos habituales de la conexión, pero no las capturas, textos ni prompts del proyecto. La inferencia se ejecuta en el dispositivo.

El proveedor de alojamiento puede mantener registros técnicos de acceso y aplicar medidas de seguridad. Este repositorio no determina un proveedor de producción ni sus plazos de conservación. Antes de desplegar una instancia pública, el operador debe identificar sus proveedores y completar esta información según su configuración real.

## Cookies y servicios

La aplicación no incluye cookies propias, publicidad, analítica ni cuentas. La preferencia de tema y la caché del modelo descritas arriba utilizan almacenamiento del navegador. Cualquier cambio que añada servicios o tratamientos exige revisar esta política antes de utilizarlo.

## Consultas y derechos

Puedes contactar con el titular para consultas o solicitudes relacionadas con datos personales que pueda tratar, como un correo que le envíes. Las capturas procesadas localmente no están a disposición del titular. También puedes acudir a la autoridad de protección de datos competente si consideras que un tratamiento vulnera tus derechos.

## Versiones publicadas

El contenido informativo de la aplicación está en `src/lib/pages.ts`, con páginas de privacidad en español e inglés. Mantener este documento y ambas versiones alineados al modificar el tratamiento o el despliegue. Publicar el repositorio en GitHub no despliega la aplicación ni cambia su procesamiento local.
