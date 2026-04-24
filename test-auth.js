// Script simple para probar Firebase Auth directamente
// Ejecuta esto en la consola del navegador

console.log("🧪 Probando Firebase Auth directamente...");

if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    const auth = firebase.auth();

    // Probar login con Google
    console.log("🔐 Intentando login con Google...");
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("✅ Login exitoso!");
            console.log("Usuario:", result.user.displayName);
            console.log("Email:", result.user.email);
        })
        .catch((error) => {
            console.error("❌ Error en login:", error.code, error.message);

            if (error.code === 'auth/operation-not-allowed') {
                console.log("🔧 SOLUCIÓN: Habilita Google Sign-in en Firebase Console");
            } else if (error.code === 'auth/unauthorized-domain') {
                console.log("🔧 SOLUCIÓN: Añade el dominio actual a dominios autorizados");
                console.log("Dominio actual:", window.location.hostname);
            }
        });
} else {
    console.error("❌ Firebase no está inicializado");
}