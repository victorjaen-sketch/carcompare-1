// Script de verificación de Firebase ACTUALIZADO
// Ejecuta esto en la consola del navegador en carcompare-mu.vercel.app

console.log("🔍 Verificando Firebase con nuevas claves...");

// Verificar si Firebase está cargado
if (typeof firebase !== 'undefined') {
    console.log("✅ Firebase SDK cargado");
    console.log("Versión:", firebase.SDK_VERSION);

    // Verificar configuración
    if (firebase.apps.length > 0) {
        console.log("✅ Firebase app inicializada");
        const app = firebase.apps[0];
        console.log("Config:", app.options);
    } else {
        console.log("❌ Firebase app NO inicializada");
    }

    // Verificar servicios
    if (firebase.auth) {
        console.log("✅ Firebase Auth disponible");
    }
    if (firebase.firestore) {
        console.log("✅ Firestore disponible");
    }
} else {
    console.log("❌ Firebase SDK NO cargado");
}

// Verificar configuración específica
console.log("🔧 Configuración actual:");
try {
    const config = {
        apiKey: "AIzaSyD43VnRxL2pMGxt676rw9TFQVB7JCIHPmQ",
        authDomain: "carcompare-b9451.firebaseapp.com",
        projectId: "carcompare-b9451",
        appId: "1:944264641748:web:31d6a00b745dcfdb564f41",
        measurementId: "G-SX67RY5D1Q"
    };
    console.log("API Key:", config.apiKey ? "Presente" : "Faltante");
    console.log("Auth Domain:", config.authDomain);
    console.log("Project ID:", config.projectId);
    console.log("App ID:", config.appId);
    console.log("Measurement ID:", config.measurementId);
} catch (e) {
    console.error("Error al verificar config:", e);
}

// Probar conexión con Firebase
console.log("🌐 Probando conexión con nuevas claves...");
fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD43VnRxL2pMGxt676rw9TFQVB7JCIHPmQ', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: false })
})
.then(response => response.json())
.then(data => {
    if (data.error) {
        console.error("❌ Error de Firebase:", data.error.message);
        if (data.error.message.includes('CONFIGURATION_NOT_FOUND')) {
            console.error("🔧 SOLUCIÓN: El proyecto 'carcompare-b9451' NO EXISTE");
            console.log("📝 Pasos para SOLUCIONAR:");
            console.log("");
            console.log("🚀 GUÍA RÁPIDA PARA CONFIGURAR FIREBASE:");
            console.log("");
            console.log("1️⃣ IR A: https://console.firebase.google.com/");
            console.log("2️⃣ HACER CLIC: 'Crear un proyecto'");
            console.log("3️⃣ NOMBRE: 'carcompare' (o el que prefieras)");
            console.log("4️⃣ HABILITAR: Google Analytics (recomendado)");
            console.log("5️⃣ ESPERAR: A que se cree el proyecto");
            console.log("");
            console.log("6️⃣ CONFIGURAR AUTHENTICATION:");
            console.log("   - Ir a Authentication > Sign-in method");
            console.log("   - Habilitar 'Google' como proveedor");
            console.log("   - Configurar nombre público: 'CarCompare'");
            console.log("");
            console.log("7️⃣ CONFIGURAR FIRESTORE:");
            console.log("   - Ir a Firestore Database > Crear base de datos");
            console.log("   - Elegir 'Modo de prueba'");
            console.log("   - Seleccionar ubicación (us-central o europe-west)");
            console.log("");
            console.log("8️⃣ OBTENER CONFIGURACIÓN WEB:");
            console.log("   - Ir a Configuración del proyecto > General > Tus apps");
            console.log("   - Hacer clic en icono '</>' (Web app)");
            console.log("   - Registrar app con nombre 'CarCompare Web'");
            console.log("   - COPIAR el objeto firebaseConfig que aparece");
            console.log("");
            console.log("9️⃣ ACTUALIZAR CÓDIGO:");
            console.log("   - Abrir script.js");
            console.log("   - Reemplazar el objeto firebaseConfig");
            console.log("   - Añadir dominios autorizados:");
            console.log("     * carcompare-mu.vercel.app");
            console.log("     * localhost");
            console.log("");
            console.log("🔟 SUBIR CAMBIOS:");
            console.log("   git add . && git commit -m 'Update Firebase config' && git push");
            console.log("");
            console.log("🎯 RESULTADO: Login con Google funcionará perfectamente");
        }
    } else {
        console.log("✅ Conexión exitosa con Firebase - ¡El proyecto existe!");
        console.log("🎉 Ahora configura dominios autorizados:");
        console.log("   Firebase Console > Authentication > Configuración");
        console.log("   Añade: carcompare-mu.vercel.app y localhost");
    }
})
.catch(error => {
    console.error("❌ Error de conexión:", error);
});

console.log("📋 Revisa los resultados arriba para diagnosticar el problema");