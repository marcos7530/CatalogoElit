# Catálogo ELIT - Aplicación Web

Una aplicación web moderna para integrar y visualizar el catálogo de productos de ELIT utilizando su API oficial.

## 🚀 Características

- **Autenticación segura** con User ID y Token
- **Búsqueda en tiempo real** de productos
- **Filtros automáticos** que se aplican instantáneamente al cambiar cualquier parámetro
- **Filtros avanzados** por marca, categoría y nivel de stock
- **Ordenamiento automático** por stock de mayor a menor
- **Vista detallada** de productos con imágenes y características
- **Diseño responsivo** compatible con dispositivos móviles
- **Paginación** para manejar grandes catálogos
- **Interfaz moderna** con tema oscuro y animaciones
- **Tema oscuro elegante** para una mejor experiencia visual

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Credenciales de API de ELIT (User ID y Token)
- Conexión a internet

## 🛠️ Instalación

1. **Descarga los archivos**:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Abre el archivo** `index.html` en tu navegador web

3. **¡Listo!** La aplicación estará disponible localmente

## 🔑 Configuración

### Credenciales Preconfiguradas

La aplicación viene configurada con credenciales por defecto:
- **User ID**: 30440
- **Token**: geuai36y0u4

### Configurar la Aplicación

1. **Apertura automática**: La aplicación se conecta automáticamente con las credenciales preconfiguradas
2. **Cambiar credenciales**: Haz clic en el ícono de configuración (⚙️) en el header para acceder al panel de configuración
3. **Nuevas credenciales**: Si necesitas usar otras credenciales, ingresa tu **User ID** y **Token** en el panel de configuración

## 📖 Uso

### Autenticación
- **Inicio automático**: La aplicación se conecta automáticamente con las credenciales preconfiguradas
- **Carga completa**: Carga automáticamente todos los productos disponibles (1,125+ productos)
- **Sin login**: No necesitas hacer login cada vez que abres la aplicación
- **Configuración opcional**: Puedes cambiar las credenciales usando el botón de configuración (⚙️) en el header

### Búsqueda de Productos
- **Aplicación automática**: Los filtros se aplican instantáneamente al cambiar cualquier parámetro
- **Búsqueda general**: Escribe en el campo de búsqueda
- **Filtro por marca**: Selecciona una marca específica
- **Filtro por categoría**: Elige una categoría de producto
- **Filtro por stock**: Filtra por nivel de stock (alto/bajo/sin stock)
- **Límite de resultados**: Ajusta cuántos productos mostrar (máx. 100)
- **Sin botón de aplicar**: No necesitas hacer clic en "Aplicar Filtros"

### Visualización
- **Vista de tarjetas**: Cada producto se muestra en una tarjeta con información básica
- **Detalles completos**: Haz clic en cualquier producto para ver información detallada
- **Imágenes**: Visualiza las imágenes del producto si están disponibles
- **Precios**: Ve precios en USD y ARS
- **Stock**: Información detallada de inventario

### Ordenamiento
- **Automático por stock**: Los productos se ordenan automáticamente por stock de mayor a menor
- **Consistente**: El ordenamiento se mantiene al aplicar filtros y búsquedas
- **Indicador visual**: Se muestra un ícono que indica el ordenamiento activo

### Navegación
- **Paginación**: Navega entre páginas de resultados
- **Información de resultados**: Ve cuántos productos se encontraron
- **Controles de página**: Botones para ir a página anterior/siguiente

## 🔧 Funcionalidades Técnicas

### API Integration
- **Endpoint**: `https://clientes.elit.com.ar/v1/api/productos`
- **Método**: POST
- **Autenticación**: JSON con user_id y token
- **Límite**: Máximo 100 productos por consulta

### Filtros Disponibles
- `limit`: Cantidad de resultados (máx. 100)
- `offset`: Índice de inicio para paginación
- `id`: Código único de producto ELIT
- `codigo_alta`: Código alfanumérico ELIT
- `codigo_producto`: SKU del producto
- `nombre`: Nombre o título del producto
- `marca`: Marca del producto
- `actualizacion`: Fecha de última actualización

### Campos de Respuesta
La API devuelve información completa de cada producto:
- Información básica (nombre, marca, categoría)
- Precios (costo, PVP USD, PVP ARS)
- Stock (nivel, cantidades por depósito)
- Características técnicas
- Imágenes y miniaturas
- Enlaces y garantías

## 🎨 Personalización

### Colores
Los colores se pueden modificar en el archivo `styles.css`:
```css
:root {
    --primary-color: #2563eb;    /* Color principal */
    --secondary-color: #f59e0b;  /* Color secundario */
    --success-color: #10b981;    /* Color de éxito */
    /* ... más variables */
}
```

### Configuración de API
Para cambiar la URL base de la API, modifica en `script.js`:
```javascript
const API_CONFIG = {
    baseUrl: 'https://clientes.elit.com.ar/v1/api',
    // ...
};
```

## 🔒 Seguridad

- Las credenciales se almacenan localmente en el navegador
- No se envían datos a servidores externos
- Todas las comunicaciones son HTTPS
- Los tokens se manejan de forma segura

## 🐛 Solución de Problemas

### Error de Autenticación
- Verifica que el User ID y Token sean correctos
- Asegúrate de tener conexión a internet
- Revisa que tu cuenta ELIT esté activa

### No se Cargan Productos
- Verifica tu conexión a internet
- Comprueba que la API de ELIT esté disponible
- Revisa la consola del navegador para errores

### Problemas de Visualización
- Actualiza la página (F5)
- Limpia la caché del navegador
- Verifica que JavaScript esté habilitado

## 📱 Compatibilidad

### Navegadores Soportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dispositivos
- Desktop (Windows, macOS, Linux)
- Tablet (iPad, Android)
- Móvil (iOS, Android)

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Descarga los nuevos archivos
2. Reemplaza los archivos existentes
3. Actualiza la página en el navegador

## 📞 Soporte

Para soporte técnico:
- Revisa la documentación de la API de ELIT
- Consulta la consola del navegador para errores
- Verifica la conectividad de red

## 📄 Licencia

Esta aplicación es para uso exclusivo de clientes ELIT con acceso a su API.

---

**Desarrollado para integrar el catálogo ELIT de manera eficiente y moderna.**
