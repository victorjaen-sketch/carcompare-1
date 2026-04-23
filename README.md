# CarCompare

Aplicación web para comparar y comprar coches con autenticación de usuario y base de datos Firebase.

## ⚠️ IMPORTANTE: Firebase NO CONFIGURADO

**El proyecto de Firebase `carcompare-b9451` NO EXISTE.** Por eso el login no funciona.

### ✅ Lo que SÍ funciona:
- Búsqueda y filtrado de coches
- Carrito de compras (datos locales)
- Comparador de vehículos
- Interfaz completa y responsive

### ❌ Lo que NO funciona:
- Login con Google
- Guardado de datos en la nube
- Favoritos persistentes

## 🚀 SOLUCIÓN: Configurar Firebase

### Opción A: Crear proyecto nuevo (Recomendado)

**Ejecuta el contenido de `firebase-debug-updated.js` en la consola del navegador** para ver la guía completa.

### Pasos detallados:

1. **Crear proyecto:**
   - Ve a https://console.firebase.google.com/
   - "Crear un proyecto" → Nombre: `carcompare`
   - Habilita Google Analytics

2. **Configurar Authentication:**
   - Authentication → Sign-in method → Habilitar Google
   - Configurar nombre público: "CarCompare"

3. **Configurar Firestore:**
   - Firestore Database → Crear base de datos → Modo de prueba

4. **Obtener configuración:**
   - Configuración del proyecto → Tus apps → Web app (</>)
   - Registrar app → Copiar `firebaseConfig`

5. **Actualizar código:**
   - Reemplazar configuración en `script.js`
   - Añadir dominios: `carcompare-mu.vercel.app` y `localhost`

6. **Subir cambios:**
   ```bash
   git add . && git commit -m "Configure Firebase" && git push
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
