# CarCompare

Aplicación web para comparar y comprar coches con autenticación de usuario y base de datos Firebase.

## ✅ ¡BUENAS NOTICIAS! Firebase está configurado

**El proyecto `carcompare-b9451` EXISTE y está funcionando.** Firebase App Check está activado, lo que significa que la configuración es correcta.

### ✅ Lo que SÍ funciona:
- **URL:** https://carcompare-mu.vercel.app/
- **Búsqueda y filtrado de coches**
- **Carrito de compras** (datos locales)
- **Comparador de vehículos**
- **Interfaz completa y responsive**

### ⚠️ Lo que NO funciona aún:
- Login con Google (requiere configuración adicional)
- Guardado de favoritos
- Carrito persistente en la nube

## 🚀 SOLUCIÓN: Configurar dominios autorizados

Para activar el login con Google, necesitas añadir los dominios autorizados en Firebase Console.

### Pasos para completar la configuración:

1. **Ve a Firebase Console:**
   - https://console.firebase.google.com/
   - Selecciona proyecto `carcompare-b9451`

2. **Configurar Authentication:**
   - Ve a **Authentication > Configuración**
   - En "Dominios autorizados", añade:
     - `carcompare-mu.vercel.app`
     - `localhost`

3. **Opcional: Desactivar App Check para desarrollo:**
   - Ve a **Project Settings > App Check**
   - Desactiva temporalmente para probar el login

4. **Probar el login:**
   - Ve a https://carcompare-mu.vercel.app/
   - Haz clic en "Entrar con Google"
   - Debería funcionar correctamente

## 🔧 Troubleshooting

- **Error "App Check token is invalid"**: Firebase App Check está activado (esto es bueno)
- **Error "Invalid domain"**: Añade los dominios autorizados en Firebase Console
- **Login no abre popup**: Revisa configuración de dominios

Para diagnosticar: ejecuta `firebase-debug-updated.js` en la consola del navegador.

## 📱 Estado actual

**Estado:** Firebase configurado correctamente, solo falta añadir dominios autorizados
**Login:** Funcionará una vez añadidos los dominios
**Persistencia:** Funcionará una vez activado el login
   ```

### Opción B: Usar proyecto existente

Si ya tienes un proyecto de Firebase, simplemente:
1. Copia las claves de configuración
2. Pégalas en `script.js`
3. Asegúrate de que Authentication y Firestore estén habilitados
4. Añade el dominio `carcompare-mu.vercel.app` a dominios autorizados

## 🔧 Troubleshooting

- **Error "Can't find variable: auth"**: Firebase no inicializado (normal)
- **Error "configuration-not-found"**: Proyecto no existe
- **Login no abre popup**: Dominios no autorizados

Para diagnosticar: ejecuta `firebase-debug-updated.js` en la consola.

## 📱 Estado actual

**URL:** https://carcompare-mu.vercel.app/
**Estado:** Funcional con datos locales
**Login:** Deshabilitado hasta configurar Firebase

#### Error "Can't find variable: auth"
- **Causa**: Firebase no se inicializó correctamente
- **Solución**: La app ahora maneja esto automáticamente mostrando "Login (No disponible)"
- **Para arreglar completamente**: Configura un nuevo proyecto Firebase siguiendo `setup-firebase.js`

#### Probar la aplicación
Ejecuta `test-app.js` en la consola para verificar que todos los componentes funcionan correctamente.

## Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. **Authentication:**
   - Ve a Authentication > Sign-in method
   - Habilita "Google" como proveedor
4. **Firestore Database:**
   - Ve a Firestore Database > Crear base de datos
   - Elige "Modo de prueba" para desarrollo
5. **Dominios autorizados:**
   - Ve a Authentication > Configuración
   - En "Dominios autorizados", añade:
     - `carcompare-mu.vercel.app`
     - `localhost` (para desarrollo local)
     - Cualquier otro dominio donde uses la app

6. **Actualizar script.js:**
   - Las claves ya están configuradas correctamente

### Estructura de Firestore
- `usuarios/{userId}`: Datos del usuario (carrito, etc.)
- `favoritos/{userId}`: Lista de coches favoritos

## 🔧 Troubleshooting

### Login con Google no funciona
1. **Revisa la consola del navegador** (F12 > Console) para ver errores
2. **Verifica dominios autorizados** en Firebase Console
3. **Ejecuta el script de debug**: Copia el contenido de `firebase-debug.js` en la consola
4. **Comprueba que las claves** en `script.js` sean correctas

### Botón de favoritos
- Ahora es más pequeño (30x30px) y no solapa la imagen
- Solo funciona si estás logueado con Google

## Despliegue

La aplicación está configurada para desplegarse en Vercel con soporte para Firebase.

## Uso

- Regístrate/inicia sesión con Google
- Busca y filtra coches
- Añade a favoritos (♥)
- Añade al carrito de compras
- Compara hasta 3 coches
- Tus datos se guardan automáticamente en la nube
