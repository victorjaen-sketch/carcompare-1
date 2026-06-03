let coches = [];
let comparados = [];
let carrito = [];
let resultadosActuales = [];
let dreamCars = [];
let dreamCarouselIndex = 0;
let dreamCarouselInterval = null;
let vpicMakes = [];
let modoBusqueda = false; // false = modo sugerencias, true = modo búsqueda
const VPIC_API = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// ⚠️ CONFIGURACIÓN TEMPORAL: Reemplaza con tus claves reales de Firebase Console
// ERROR: El proyecto actual 'carcompare-b9451' parece no existir o estar mal configurado
// SOLUCIÓN: Crea un nuevo proyecto en https://console.firebase.google.com/

const firebaseConfig = {
    // ⚠️ ESTAS CLAVES PUEDEN NO FUNCIONAR - Crea un nuevo proyecto
    apiKey: "AIzaSyD43VnRxL2pMGxt676rw9TFQVB7JCIHPmQ",
    authDomain: "carcompare-b9451.firebaseapp.com",
    projectId: "carcompare-b9451",
    storageBucket: "carcompare-b9451.firebasestorage.app",
    messagingSenderId: "944264641748",
    appId: "1:944264641748:web:31d6a00b745dcfdb564f41",
    measurementId: "G-SX67RY5D1Q"
};

// Verificar configuración antes de inicializar
console.log("🔍 Verificando configuración de Firebase...");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Auth Domain:", firebaseConfig.authDomain);

// ⚠️ TEMPORAL: Deshabilitar Firebase hasta que se configure correctamente
let firebaseInitialized = false;
let auth = null;
let db = null;
let analytics = null;

try {
    firebase.initializeApp(firebaseConfig);
    firebaseInitialized = true;
    console.log("✅ Firebase inicializado correctamente");
    auth = firebase.auth();
    db = firebase.firestore();
    analytics = firebase.analytics();
} catch (error) {
    console.error("❌ Error al inicializar Firebase:", error);
    console.error("🔧 SOLUCIÓN: Crea un nuevo proyecto en Firebase Console");
    console.log("📋 Ejecuta setup-firebase.js para instrucciones detalladas");

    // Modo sin Firebase: la app funciona pero sin login/persistencia
    console.log("⚠️ Modo sin Firebase activado - Funcionalidad limitada");
    firebaseInitialized = false;
}

function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// 1. Función de Login con Google
async function login() {
    if (!firebaseInitialized) {
        alert("Firebase no está configurado. Revisa la consola para instrucciones.");
        console.log("📋 Ejecuta setup-firebase.js para configurar Firebase correctamente");
        return;
    }

    console.log("Iniciando login con Google...");
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        console.log("Provider creado:", provider);
        const result = await auth.signInWithPopup(provider);
        console.log("Login exitoso:", result.user.displayName);
    } catch (error) {
        console.error("Error al entrar:", error);
        alert("Error al iniciar sesión: " + error.message);
    }
}

// Función de logout
function logout() {
    if (!firebaseInitialized || !auth) {
        alert("Firebase no está configurado.");
        return;
    }

    console.log("Cerrando sesión...");
    auth.signOut().then(() => {
        console.log("Sesión cerrada correctamente");
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
}

// 2. Autenticación local con base de datos en localStorage
const LOCAL_USERS_KEY = 'autosel_local_users';
const LOCAL_SESSION_KEY = 'autosel_current_user';
let usuariosLocal = {};
let usuarioActual = null;

function hashTexto(texto) {
    let hash = 0;
    const str = String(texto);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(16);
}

function cargarUsuariosLocales() {
    try {
        const data = localStorage.getItem(LOCAL_USERS_KEY);
        usuariosLocal = data ? JSON.parse(data) : {};
    } catch (error) {
        usuariosLocal = {};
    }
}

function guardarUsuariosLocales() {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usuariosLocal));
}

function cargarSesionLocal() {
    usuarioActual = localStorage.getItem(LOCAL_SESSION_KEY);
    if (usuarioActual && !usuariosLocal[usuarioActual]) {
        usuarioActual = null;
        localStorage.removeItem(LOCAL_SESSION_KEY);
    }
}

function guardarSesionLocal(nombre) {
    usuarioActual = nombre;
    localStorage.setItem(LOCAL_SESSION_KEY, nombre);
    actualizarAuthActions();
}

function cerrarSesionLocal() {
    usuarioActual = null;
    localStorage.removeItem(LOCAL_SESSION_KEY);
    actualizarAuthActions();
}

function registrarInteraccion(tipo, payload) {
    if (!usuarioActual) return;
    const usuario = usuariosLocal[usuarioActual];
    if (!usuario) return;
    usuario.interacciones = usuario.interacciones || [];
    usuario.interacciones.push({ tipo, payload, fecha: new Date().toISOString() });
    guardarUsuariosLocales();
}

function actualizarAuthActions() {
    const container = document.getElementById('auth-actions');
    if (!container) return;
    if (usuarioActual) {
        container.innerHTML = `
            <div class="auth-welcome">
                <span>Hola, ${usuarioActual}</span>
                <button id="auth-logout" class="btn-secondary">Cerrar sesión</button>
            </div>`;
        document.getElementById('auth-logout').addEventListener('click', cerrarSesionLocal);
    } else {
        container.innerHTML = `<button id="auth-open" class="btn-primary">Iniciar sesión</button>`;
        document.getElementById('auth-open').addEventListener('click', mostrarAuthSection);
    }
}

function mostrarAuthSection() {
    const section = document.getElementById('auth-section');
    if (!section) return;
    section.classList.remove('hidden');
    cambiarAuthTab('login');
}

function ocultarAuthSection() {
    const section = document.getElementById('auth-section');
    if (!section) return;
    section.classList.add('hidden');
}

function cambiarAuthTab(tipo) {
    document.getElementById('auth-tab-login').classList.toggle('active', tipo === 'login');
    document.getElementById('auth-tab-register').classList.toggle('active', tipo === 'register');
    renderizarAuthForm(tipo);
}

function renderizarAuthForm(tipo) {
    const container = document.getElementById('auth-form-container');
    if (!container) return;
    if (tipo === 'login') {
        container.innerHTML = `
            <form id="auth-form" class="auth-form">
                <label>Usuario <input id="auth-username" type="text" required></label>
                <label>Contraseña <input id="auth-password" type="password" required></label>
                <button type="submit" class="btn-primary">Entrar</button>
            </form>`;
        document.getElementById('auth-form').addEventListener('submit', autenticarLocal);
    } else {
        container.innerHTML = `
            <form id="auth-form" class="auth-form">
                <label>Usuario <input id="auth-username" type="text" required></label>
                <label>Contraseña <input id="auth-password" type="password" required></label>
                <button type="submit" class="btn-primary">Registrar</button>
            </form>`;
        document.getElementById('auth-form').addEventListener('submit', registrarLocal);
    }
}

function autenticarLocal(event) {
    event.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!username || !password) return;

    const user = usuariosLocal[username];
    if (!user || user.password !== hashTexto(password)) {
        alert('Usuario o contraseña incorrectos.');
        return;
    }

    guardarSesionLocal(username);
    cargarDatosUsuario();
    ocultarAuthSection();
    alert(`Bienvenido de nuevo, ${username}`);
}

function registrarLocal(event) {
    event.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!username || !password) return;
    if (usuariosLocal[username]) {
        alert('El usuario ya existe. Usa otro nombre.');
        return;
    }

    usuariosLocal[username] = {
        password: hashTexto(password),
        interacciones: [],
        carrito: [],
        preferencias: {}
    };
    guardarUsuariosLocales();
    guardarSesionLocal(username);
    cargarDatosUsuario();
    ocultarAuthSection();
    alert(`Cuenta creada. Bienvenido, ${username}`);
}

const authCloseBtn = document.getElementById('auth-close');
if (authCloseBtn) {
    authCloseBtn.addEventListener('click', ocultarAuthSection);
}

const authTabLogin = document.getElementById('auth-tab-login');
const authTabRegister = document.getElementById('auth-tab-register');
if (authTabLogin) {
    authTabLogin.addEventListener('click', () => cambiarAuthTab('login'));
}
if (authTabRegister) {
    authTabRegister.addEventListener('click', () => cambiarAuthTab('register'));
}

async function cargarDatosUsuario() {
    if (!usuarioActual) return;
    const usuario = usuariosLocal[usuarioActual];
    if (!usuario) return;

    carrito = usuario.carrito || [];
    actualizarCarrito();
}

function guardarDatosUsuario() {
    if (!usuarioActual) return;
    const usuario = usuariosLocal[usuarioActual];
    if (!usuario) return;

    usuario.carrito = carrito;
    guardarUsuariosLocales();
}

// 5. Toggle Favorito
async function toggleFav(modelo) {
    if (!firebaseInitialized || !auth || !db) {
        alert("Firebase no está configurado. Los favoritos requieren iniciar sesión.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("¡Debes iniciar sesión para guardar favoritos!");
        return;
    }

    try {
        const userRef = db.collection('favoritos').doc(user.uid);
        const doc = await userRef.get();
        const favoritos = doc.exists ? doc.data() : {};

        if (favoritos[modelo]) {
            // Quitar favorito
            delete favoritos[modelo];
            alert(`${modelo} eliminado de favoritos`);
        } else {
            // Añadir favorito
            favoritos[modelo] = true;
            alert(`${modelo} añadido a favoritos`);
        }

        await userRef.set(favoritos);

    } catch (error) {
        console.error("Error con favoritos:", error);
    }
}

async function cargarDatos() {
    cargarUsuariosLocales();
    cargarSesionLocal();
    actualizarAuthActions();
    cargarDatosUsuario();
    await cargarCochesLocales();
    await cargarMarcasVpic();
    mostrarSugerencias();
    mostrarCarruselDeSueños();
}

const quizPreguntas = [
    {
        pregunta: '¿Dónde usas más el coche?',
        opciones: ['Ciudad', 'Montaña', 'Autopista', 'Uso mixto']
    },
    {
        pregunta: '¿Cuántos kilómetros haces normalmente al día?',
        opciones: ['Menos de 30 km', '30 a 80 km', 'Más de 80 km']
    },
    {
        pregunta: '¿Cuántas personas suelen viajar contigo?',
        opciones: ['1-2', '3-4', '5 o más']
    },
    {
        pregunta: '¿Prefieres un coche más económico o más cómodo?',
        opciones: ['Económico', 'Cómodo', 'Equilibrado']
    },
    {
        pregunta: '¿Te interesa un coche eléctrico?',
        opciones: ['Sí', 'No', 'Me da igual']
    }
];
let respuestasQuiz = [];
let preguntaActual = 0;

function abrirQuiz() {
    document.getElementById('quiz-section').classList.remove('hidden');
    document.getElementById('quiz-close-button').classList.remove('hidden');
    document.getElementById('quiz-card').classList.remove('hidden');
    document.getElementById('quiz-question-card').classList.add('hidden');
    document.getElementById('quiz-result-card').classList.add('hidden');
    window.scrollTo({ top: document.getElementById('quiz-section').offsetTop - 20, behavior: 'smooth' });
}

function cerrarQuiz() {
    document.getElementById('quiz-section').classList.add('hidden');
    document.getElementById('quiz-close-button').classList.add('hidden');
}

function iniciarQuiz() {
    respuestasQuiz = [];
    preguntaActual = 0;
    renderizarPregunta();
}

function renderizarPregunta() {
    const pregunta = quizPreguntas[preguntaActual];
    const card = document.getElementById('quiz-question-card');
    card.classList.remove('hidden');
    document.getElementById('quiz-card').classList.add('hidden');

    card.innerHTML = `
        <h3>${pregunta.pregunta}</h3>
        <div class="quiz-options">${pregunta.opciones.map((opcion, index) => `<button class="btn-secondary quiz-option" data-index="${index}">${opcion}</button>`).join('')}</div>
        <div class="quiz-progress">Pregunta ${preguntaActual + 1} de ${quizPreguntas.length}</div>
    `;

    card.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
            respuestasQuiz[preguntaActual] = btn.textContent;
            preguntaActual += 1;
            if (preguntaActual >= quizPreguntas.length) {
                mostrarResultadoQuiz();
            } else {
                renderizarPregunta();
            }
        });
    });
}

function elegirCategoriaQuiz() {
    const scores = {
        '4x4': 0,
        'daily': 0,
        'lujo': 0,
        'electrico': 0
    };

    const [uso, km, pasajeros, estilo, electrico] = respuestasQuiz;

    if (uso === 'Montaña') {
        scores['4x4'] += 3;
    }
    if (uso === 'Ciudad') {
        scores['daily'] += 2;
    }
    if (uso === 'Autopista') {
        scores['lujo'] += 2;
    }
    if (uso === 'Uso mixto') {
        scores['daily'] += 1;
        scores['4x4'] += 1;
    }

    if (km === 'Más de 80 km') {
        scores['lujo'] += 2;
    }
    if (km === 'Menos de 30 km') {
        scores['daily'] += 2;
    }

    if (pasajeros === '3-4') {
        scores['daily'] += 1;
    }
    if (pasajeros === '5 o más') {
        scores['daily'] += 2;
    }

    if (estilo === 'Cómodo') {
        scores['lujo'] += 2;
    }
    if (estilo === 'Económico') {
        scores['daily'] += 2;
    }

    if (electrico === 'Sí') {
        scores['electrico'] += 3;
    }
    if (electrico === 'Me da igual') {
        scores['daily'] += 1;
    }

    const mejor = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return mejor;
}

function buscarCocheRecomendado(categoria) {
    const encontrado = coches.find(c => obtenerCategoriasCoche(c).includes(categoria));
    if (encontrado) return encontrado;
    return coches.length ? coches[0] : { marca: 'Coche ideal', modelo: '', imagen: 'https://via.placeholder.com/400x250?text=Coche+recomendado' };
}

function mostrarResultadoQuiz() {
    const categoria = elegirCategoriaQuiz();
    const coche = buscarCocheRecomendado(categoria);
    const card = document.getElementById('quiz-result-card');
    const imagen = coche.imagen || `https://via.placeholder.com/400x250?text=${encodeURIComponent(coche.marca + ' ' + coche.modelo)}`;

    registrarInteraccion('quiz', {
        categoria,
        modelo: `${coche.marca} ${coche.modelo || ''}`.trim(),
        respuestas: [...respuestasQuiz]
    });

    card.innerHTML = `
        <h3>Tu coche ideal es: <span class="quiz-category">${categoria.toUpperCase()}</span></h3>
        <div class="quiz-result-grid">
            <img src="${imagen}" alt="Coche recomendado" class="quiz-result-image">
            <div class="quiz-result-summary">
                <p><strong>Categoría recomendada:</strong> ${categoria}</p>
                <p><strong>Modelo sugerido:</strong> ${coche.marca} ${coche.modelo || ''}</p>
                <p><strong>Uso ideal:</strong> ${respuestasQuiz[0]}</p>
                <p><strong>Kilometraje diario:</strong> ${respuestasQuiz[1]}</p>
                <p><strong>Viajes con:</strong> ${respuestasQuiz[2]}</p>
            </div>
        </div>
        <button id="quiz-restart-button" class="btn-primary">Volver a intentar</button>
    `;
    card.classList.remove('hidden');
    document.getElementById('quiz-question-card').classList.add('hidden');

    document.getElementById('quiz-restart-button').addEventListener('click', iniciarQuiz);
}

async function cargarMarcasVpic() {
    try {
        const response = await fetch(`${VPIC_API}/getallmakes?format=json`);
        const data = await response.json();
        vpicMakes = data.Results
            .map(item => item.Make_Name)
            .filter(Boolean)
            .sort((a, b) => normalizarTexto(a).localeCompare(normalizarTexto(b)));
    } catch (error) {
        console.warn('No se pudieron cargar marcas desde vPIC:', error);
    }
}

async function cargarCochesLocales() {
    try {
        const res = await fetch('/coches.json');
        coches = await res.json();
    } catch (err) {
        console.error('Error cargando coches.json:', err);
        coches = [];
    }
}

function obtenerCochesMasCaros() {
    const conPrecio = coches.filter(c => Number(c.precio) > 0);
    if (conPrecio.length > 0) {
        return conPrecio
            .slice()
            .sort((a, b) => Number(b.precio) - Number(a.precio))
            .slice(0, 5);
    }
    return coches.slice(0, 5);
}

function mostrarCarruselDeSueños() {
    const topCars = obtenerCochesMasCaros();
    dreamCars = topCars;
    const track = document.getElementById('dream-carousel-track');
    const dots = document.getElementById('dream-carousel-dots');
    const prevBtn = document.getElementById('dream-prev');
    const nextBtn = document.getElementById('dream-next');

    if (!track || !dots || !prevBtn || !nextBtn) return;

    track.innerHTML = '';
    dots.innerHTML = '';
    dreamCarouselIndex = 0;

    if (topCars.length === 0) {
        track.innerHTML = '<div class="dream-empty">No hay coches disponibles para mostrar en el carrusel.</div>';
        return;
    }

    topCars.forEach((coche, index) => {
        const imagenHTML = construirImgCarImages(coche, 'carousel-image', 700, 420);
        const precio = coche.precio ? `$${Number(coche.precio).toLocaleString()}` : 'Precio no disponible';
        const año = coche.año || 'Año desconocido';
        const tipo = obtenerCategoriasCoche(coche).join(' · ') || 'Lujo · Exclusivo';

        const slide = document.createElement('div');
        slide.className = 'dream-carousel-slide';
        slide.innerHTML = `
            <div class="carousel-card">
                <div>${imagenHTML}</div>
                <div class="carousel-content">
                    <span class="carousel-pill">Coche de tus sueños</span>
                    <h3>${coche.marca} ${coche.modelo || ''}</h3>
                    <p>${tipo}</p>
                    <p><strong>${precio}</strong> · ${año}</p>
                    <p>Descubre un vehículo premium pensado para quienes quieren lo mejor en rendimiento y estilo.</p>
                    <button class="btn-primary" onclick="seleccionarCocheDelSueño(${index})">Comparar este</button>
                </div>
            </div>
        `;

        track.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.type = 'button';
        dot.addEventListener('click', () => {
            showDreamSlide(index);
            resetDreamCarousel();
        });
        dots.appendChild(dot);
    });

    prevBtn.addEventListener('click', () => {
        showDreamSlide(dreamCarouselIndex - 1);
        resetDreamCarousel();
    });
    nextBtn.addEventListener('click', () => {
        showDreamSlide(dreamCarouselIndex + 1);
        resetDreamCarousel();
    });

    showDreamSlide(0);
    startDreamCarousel();
}

function showDreamSlide(index) {
    const slides = Array.from(document.querySelectorAll('.dream-carousel-slide'));
    if (!slides.length) return;
    dreamCarouselIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === dreamCarouselIndex);
    });
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === dreamCarouselIndex));
}

function startDreamCarousel() {
    clearInterval(dreamCarouselInterval);
    dreamCarouselInterval = setInterval(() => {
        showDreamSlide(dreamCarouselIndex + 1);
    }, 6000);
}

function resetDreamCarousel() {
    clearInterval(dreamCarouselInterval);
    startDreamCarousel();
}

function seleccionarCocheDelSueño(index) {
    if (!dreamCars[index]) return;
    añadirComparadorDesdeLista(dreamCars, index);
}

function crearCocheVpic({ marca, modelo = '', año = '', km = null, combustible = null, source = 'vpic' }) {
    return {
        marca,
        modelo,
        año,
        km,
        combustible,
        precio: null,
        source,
        imagen: `https://picsum.photos/id/${Math.floor(Math.random() * 1000) + 100}/400/250`
    };
}

function escapeHtmlAttribute(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const CATEGORIAS = ['4x4', 'lujo', 'daily', 'diesel', 'gasolina', 'electrico'];

function obtenerCategoriasCoche(coche) {
    const categorias = [];
    const combustible = normalizarTexto(coche.combustible || '');
    const traccion = normalizarTexto(coche.traccion || '');
    const precio = Number(coche.precio) || 0;
    const marca = normalizarTexto(coche.marca || '');
    const modelo = normalizarTexto(coche.modelo || '');

    if (traccion.includes('4x4') || traccion.includes('awd') || traccion.includes('4wd')) {
        categorias.push('4x4');
    }

    if (precio > 100000 || marca === 'ferrari' || marca === 'aston martin' || marca === 'delorean') {
        categorias.push('lujo');
    }

    if (precio > 0 && precio <= 45000 && !categorias.includes('lujo')) {
        categorias.push('daily');
    }

    if (combustible.includes('diésel') || combustible.includes('diesel')) {
        categorias.push('diesel');
    }

    if (combustible.includes('gasolina')) {
        categorias.push('gasolina');
    }

    if (combustible.includes('eléctrico') || combustible.includes('electrico')) {
        categorias.push('electrico');
    }

    // Asegurar que los Ferraris, Aston Martin y DeLorean siempre sean de lujo
    if ((marca === 'ferrari' || marca === 'aston martin' || marca === 'delorean') && !categorias.includes('lujo')) {
        categorias.push('lujo');
    }

    return categorias;
}

function obtenerCategoriasSeleccionadas() {
    return Array.from(document.querySelectorAll('.category-checkbox'))
        .filter(input => input.checked)
        .map(input => input.value);
}

function filtrarPorCategorias(lista) {
    const seleccionadas = obtenerCategoriasSeleccionadas();
    if (!seleccionadas.length) return lista;

    return lista.filter(coche => {
        const categoriasCoche = obtenerCategoriasCoche(coche);
        return seleccionadas.every(cat => categoriasCoche.includes(cat));
    });
}

function actualizarCarrito() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    if (!carrito.length) {
        cartItems.innerHTML = '<p>No hay coches en la cesta.</p>';
        cartTotal.textContent = '$0';
        checkoutButton.disabled = true;
        return;
    }

    const total = carrito.reduce((sum, coche) => sum + (Number(coche.precio) || 0), 0);
    cartTotal.textContent = `$${total.toLocaleString()}`;
    checkoutButton.disabled = false;

    cartItems.innerHTML = carrito.map((coche, index) => {
        const precio = coche.precio ? `$${Number(coche.precio).toLocaleString()}` : 'Precio no disponible';
        return `
            <div class="cart-item">
                <div>
                    <p><strong>${coche.marca} ${coche.modelo || ''}</strong></p>
                    <p>${precio}</p>
                </div>
                <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
            </div>
        `;
    }).join('');
}

function comprarCoche(index) {
    const coche = resultadosActuales[index];
    if (!coche) return;
    if (!coche.precio) {
        alert('Este coche no tiene precio disponible. Contacta con nosotros para más información.');
        return;
    }

    if (carrito.some(item => item.marca === coche.marca && item.modelo === coche.modelo && item.año === coche.año)) {
        alert('Este coche ya está en la cesta.');
        return;
    }

    carrito.push(coche);
    actualizarCarrito();
    guardarDatosUsuario();
    registrarInteraccion('comprar', { origen: 'busqueda', coche: `${coche.marca} ${coche.modelo}` });
    alert(`${coche.marca} ${coche.modelo} añadido a la cesta.`);
}

function comprarSugerencia(index) {
    const sugerencias = obtenerSugerencias();
    const coche = sugerencias[index];
    if (!coche) return;
    if (!coche.precio) {
        alert('Este coche no tiene precio disponible. Contacta con nosotros para más información.');
        return;
    }

    if (carrito.some(item => item.marca === coche.marca && item.modelo === coche.modelo && item.año === coche.año)) {
        alert('Este coche ya está en la cesta.');
        return;
    }

    carrito.push(coche);
    actualizarCarrito();
    guardarDatosUsuario();
    registrarInteraccion('comprar', { origen: 'sugerencia', coche: `${coche.marca} ${coche.modelo}` });
    alert(`${coche.marca} ${coche.modelo} añadido a la cesta.`);
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    guardarDatosUsuario();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarrito();
    guardarDatosUsuario();
}

function construirImgCarImages(coche, clase, ancho = 400, alto = 250) {
    const marca = escapeHtmlAttribute(coche.marca || '');
    const modelo = escapeHtmlAttribute(coche.modelo || '');
    const año = escapeHtmlAttribute(coche.año || '');
    const altText = escapeHtmlAttribute(`${coche.marca || 'Coche'} ${coche.modelo || ''}`.trim());
    const srcFallback = escapeHtmlAttribute(coche.imagen || `https://via.placeholder.com/${ancho}x${alto}/cccccc/666666?text=Buscando+imagen`);

    return `<img src="${srcFallback}" alt="${altText}" class="${clase}" onerror="this.src='https://via.placeholder.com/${ancho}x${alto}/cccccc/666666?text=No+Image'" data-ci-make="${marca}" data-ci-model="${modelo}" data-ci-year="${año}" data-ci-width="${ancho}" data-ci-height="${alto}" data-ci-format="webp">`;
}

function obtenerSugerencias() {
    // 1. El coche más económico (menor precio)
    const masBajo = coches.reduce((min, c) => {
        const pMin = Number(min.precio) || Infinity;
        const pC = Number(c.precio) || Infinity;
        return pC < pMin ? c : min;
    });

    // 2. El mejor calidad-precio (potencia/precio más alto)
    const mejorCalidad = coches.reduce((best, c) => {
        const potC = Number(c.potencia) || 0;
        const precioC = Number(c.precio) || Infinity;
        const relacionC = precioC > 0 ? potC / precioC : 0;

        const potB = Number(best.potencia) || 0;
        const precioB = Number(best.precio) || Infinity;
        const relacionB = precioB > 0 ? potB / precioB : 0;

        return relacionC > relacionB ? c : best;
    });

    // 3. Un coche eléctrico
    const electricos = coches.filter(c => normalizarTexto(c.combustible).includes('electrico'));
    const electrico = electricos.length > 0 ? electricos[Math.floor(Math.random() * electricos.length)] : null;

    const sugerencias = [
        {...masBajo, destacado: 'Más Económico'},
        {...mejorCalidad, destacado: 'Mejor Relación Precio-Potencia'},
    ];

    if (electrico) {
        sugerencias.push({...electrico, destacado: 'Eléctrico'});
    }

    return sugerencias.slice(0, 3);
}

function mostrarSugerencias() {
    const sugerencias = obtenerSugerencias();
    const contenedor = document.getElementById('sugerencias');
    contenedor.innerHTML = '';

    if (!sugerencias.length) {
        contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999; font-size: 1.1em;">No hay sugerencias disponibles por el momento. Intenta cargar la página de nuevo.</div>';
        return;
    }

    sugerencias.forEach((coche, index) => {
        const modelo = coche.modelo || 'Modelo no disponible';
        const año = coche.año || 'No disponible';
        const cilindros = coche.cilindros || 'N/A';
        const potencia = coche.potencia ? `${coche.potencia} HP` : 'N/A';
        const combustible = coche.combustible || 'N/A';
        const traccion = coche.traccion || 'N/A';
        const carroceria = coche.carroceria || 'N/A';
        const precio = coche.precio ? `$${coche.precio.toLocaleString()}` : 'Precio no disponible';
        const categorias = obtenerCategoriasCoche(coche);
        const imagenHTML = construirImgCarImages(coche, 'sugerencia-imagen', 400, 250);

        const div = document.createElement('div');
        div.classList.add('sugerencia-coche');

        div.innerHTML = `
            ${imagenHTML}
            <h3>${coche.marca} ${modelo}</h3>
            <div class="coche-tags">
                ${categorias.map(cat => {
                    const safeClass = cat.replace(/[^a-z0-9]+/gi, '-');
                    return `<span class="coche-tag tag-${safeClass}">${cat}</span>`;
                }).join('')}
            </div>
            <span class="destacado">${coche.destacado}</span>
            <p><strong>⚙️ Motor:</strong> ${cilindros} cilindros</p>
            <p><strong>💨 Potencia:</strong> ${potencia}</p>
            <p><strong>⛽ Combustible:</strong> ${combustible}</p>
            <p><strong>💰 Precio:</strong> ${precio}</p>
            <p><strong>📅</strong> ${año}</p>
            <button onclick="añadirComparadorDesdeSugerencia(${index})">Seleccionar</button>
            <button class="btn-buy" onclick="comprarSugerencia(${index})" ${coche.precio ? '' : 'disabled'}>${coche.precio ? 'Comprar' : 'Consultar'}</button>
        `;

        contenedor.appendChild(div);
    });
}

function añadirComparadorDesdeSugerencia(index) {
    const sugerencias = obtenerSugerencias();
    añadirComparadorDesdeLista(sugerencias, index);
}

function añadirComparadorDesdeLista(lista, index) {
    if (comparados.length >= 3) {
        alert('Solo puedes comparar 3 coches máximo');
        return;
    }

    const coche = lista[index];
    if (comparados.some(c => c.marca === coche.marca && c.modelo === coche.modelo)) {
        alert('Este coche ya está en el comparador');
        return;
    }

    comparados.push(coche);
    mostrarComparador();
}

function filtrarPorOpciones(lista) {
    const combustible = normalizarTexto(document.getElementById('filtro-combustible').value);
    const año = document.getElementById('filtro-año').value;

    let resultados = lista.filter(coche => {
        if (combustible && coche.combustible) {
            if (!normalizarTexto(coche.combustible).includes(combustible)) {
                return false;
            }
        }

        if (año) {
            if (año === '2018') {
                if (coche.año > 2018) return false;
            } else {
                if (coche.año.toString() !== año) return false;
            }
        }

        return true;
    });

    resultados = filtrarPorCategorias(resultados);
    return resultados;
}

function mostrarCoches(lista) {
    resultadosActuales = lista;
    const contenedor = document.getElementById('lista-coches');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="font-size: 1.2em; color: #999;">🔍 No se han encontrado coches.</p></div>';
        return;
    }

    lista.forEach((coche, index) => {
        const modelo = coche.modelo || 'Modelo no disponible';
        const año = coche.año || 'No disponible';
        const cilindros = coche.cilindros || 'N/A';
        const potencia = coche.potencia ? `${coche.potencia} HP` : 'N/A';
        const combustible = coche.combustible || 'N/A';
        const traccion = coche.traccion || 'N/A';
        const carroceria = coche.carroceria || 'N/A';
        const precio = coche.precio ? `$${coche.precio.toLocaleString()}` : 'Precio no disponible';
        const categorias = obtenerCategoriasCoche(coche);
        const imagenHTML = construirImgCarImages(coche, 'coche-imagen', 400, 250);
        const source = coche.source ? `<small>Fuente: ${coche.source}</small>` : '';

        const div = document.createElement('div');
        div.classList.add('coche');

        div.innerHTML = `
            <div style="position: relative;">
                ${imagenHTML}
            </div>
            <h3>${coche.marca} ${modelo}</h3>
            <div class="coche-tags">
                ${categorias.map(cat => {
                    const safeClass = cat.replace(/[^a-z0-9]+/gi, '-');
                    return `<span class="coche-tag tag-${safeClass}">${cat}</span>`;
                }).join('')}
            </div>
            <p><strong>⚙️ Motor:</strong> ${cilindros} cilindros</p>
            <p><strong>💨 Potencia:</strong> ${potencia}</p>
            <p><strong>⛽ Combustible:</strong> ${combustible}</p>
            <p><strong>🔄 Tracción:</strong> ${traccion}</p>
            <p><strong>📦 Carrocería:</strong> ${carroceria}</p>
            <p><strong>💰 Precio:</strong> ${precio}</p>
            <p><strong>📅</strong> ${año}</p>
            ${source}
            <button onclick="añadirComparador(${index})">Comparar</button>
            <button class="btn-buy" onclick="comprarCoche(${index})" ${coche.precio ? '' : 'disabled'}>${coche.precio ? 'Comprar' : 'Consultar'}</button>
        `;

        contenedor.appendChild(div);
    });
}

function añadirComparador(index) {
    if (comparados.length >= 3) {
        alert('Solo puedes comparar 3 coches máximo');
        return;
    }

    const coche = resultadosActuales[index];
    if (comparados.some(c => c.marca === coche.marca && c.modelo === coche.modelo)) {
        alert('Este coche ya está en el comparador');
        return;
    }

    comparados.push(coche);
    mostrarComparador();
}

function mostrarComparador() {
    const comp = document.getElementById('comparador');
    comp.innerHTML = '';

    if (comparados.length === 0) {
        comp.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #999;">Selecciona coches para compararlos aquí.</p>';
        return;
    }

    const precios = comparados.map(c => Number(c.precio) || Infinity);
    const potencias = comparados.map(c => Number(c.potencia) || 0);
    const años = comparados.map(c => Number(c.año) || 0);
    const cilindrosArr = comparados.map(c => Number(c.cilindros) || 0);
    const comparar = comparados.length > 1;

    const mejorPrecio = comparar ? Math.min(...precios) : null;
    const mejorPotencia = comparar ? Math.max(...potencias) : null;
    const mejorAño = comparar ? Math.max(...años) : null;
    const mejorCilindros = comparar ? Math.max(...cilindrosArr) : null;

    comparados.forEach((coche, idx) => {
        const año = coche.año || 'No disponible';
        const cilindros = coche.cilindros || 'N/A';
        const potencia = coche.potencia ? `${coche.potencia} HP` : 'N/A';
        const combustible = coche.combustible || 'N/A';
        const traccion = coche.traccion || 'N/A';
        const carroceria = coche.carroceria || 'N/A';
        const precio = coche.precio ? `$${coche.precio.toLocaleString()}` : 'Precio no disponible';
        const imagenHTML = construirImgCarImages(coche, 'comparador-imagen', 200, 150);

        const item = document.createElement('div');
        item.classList.add('comp-item');
        item.innerHTML = `
            ${imagenHTML}
            <h4>${coche.marca} ${coche.modelo || ''}</h4>
            <p class="metric año"><strong>📅 Año:</strong> <span>${año}</span></p>
            <p class="metric cilindros"><strong>⚙️ Motor:</strong> <span>${cilindros} cilindros</span></p>
            <p class="metric potencia"><strong>💨 Potencia:</strong> <span>${potencia}</span></p>
            <p class="metric combustible"><strong>⛽ Combustible:</strong> <span>${combustible}</span></p>
            <p class="metric traccion"><strong>🔄 Tracción:</strong> <span>${traccion}</span></p>
            <p class="metric carroceria"><strong>📦 Carrocería:</strong> <span>${carroceria}</span></p>
            <p class="metric precio"><strong>💰 Precio:</strong> <span>${precio}</span></p>
            <button onclick="eliminarComparador(${idx})" style="background: #e74c3c; color: white; padding: 8px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; width: 100%;">Eliminar</button>
            <hr>
        `;

        if (comparar) {
            if (precios[idx] === mejorPrecio && precio !== 'Precio no disponible') {
                item.querySelector('.metric.precio')?.classList.add('metric-best');
            }
            if (potencias[idx] === mejorPotencia && potencia !== 'N/A') {
                item.querySelector('.metric.potencia')?.classList.add('metric-best');
            }
            if (años[idx] === mejorAño && año !== 'No disponible') {
                item.querySelector('.metric.año')?.classList.add('metric-best');
            }
            if (cilindrosArr[idx] === mejorCilindros && cilindros !== 'N/A') {
                item.querySelector('.metric.cilindros')?.classList.add('metric-best');
            }
        }

        comp.appendChild(item);
    });
}

function eliminarComparador(index) {
    comparados.splice(index, 1);
    mostrarComparador();
}

async function obtenerModelosPorMarcaYAnio(marca, año) {
    try {
        const response = await fetch(`${VPIC_API}/getmodelsformakeyear/make/${encodeURIComponent(marca)}/modelyear/${año}?format=json`);
        const data = await response.json();
        return data.Results.map(item => crearCocheVpic({
            marca,
            modelo: item.Model_Name,
            año,
            source: `vPIC (${marca} ${año})`
        }));
    } catch (error) {
        console.warn('Error al obtener modelos por marca y año:', error);
        return [crearCocheVpic({ marca, año, source: `vPIC (${marca} ${año})` })];
    }
}

async function buscarEnVPIC(texto) {
    if (!texto || !vpicMakes.length) {
        return [];
    }

    const añoMatch = texto.match(/\b(19|20)\d{2}\b/);
    if (añoMatch) {
        const año = añoMatch[0];
        const makeTexto = texto.replace(año, '').trim();
        const makeEncontrado = vpicMakes.find(make => normalizarTexto(make).includes(normalizarTexto(makeTexto)));
        if (makeEncontrado) {
            return await obtenerModelosPorMarcaYAnio(makeEncontrado, año);
        }
    }

    const coincidencias = vpicMakes
        .filter(make => normalizarTexto(make).includes(texto))
        .slice(0, 30);

    return coincidencias.map(make => crearCocheVpic({ marca: make, source: 'vPIC' }));
}

async function buscarCoches(texto) {
    const textoNormalizado = normalizarTexto(texto);
    const local = coches.filter(coche => {
        const datos = `${coche.marca} ${coche.modelo} ${coche.combustible} ${coche.año}`;
        return normalizarTexto(datos).includes(textoNormalizado);
    });
    const vpic = await buscarEnVPIC(textoNormalizado);
    const todos = [...local, ...vpic];
    const filtrados = filtrarPorOpciones(todos);
    return filtrados;
}

function toggleModoBusqueda() {
    modoBusqueda = !modoBusqueda;
    const searchSection = document.getElementById('search-section');
    const resultsSection = document.getElementById('results-section');
    const heroSection = document.querySelector('.hero-section');
    const verTodosBtn = document.getElementById('ver-todos');
    const btnHome = document.getElementById('btn-home');

    if (modoBusqueda) {
        // Mostrar modo búsqueda
        heroSection.style.display = 'none';
        searchSection.style.display = 'block';
        resultsSection.style.display = 'block';
        btnHome.style.display = 'inline-block';
        verTodosBtn.textContent = 'Volver a Sugerencias';
        mostrarCoches(filtrarPorOpciones(coches));
    } else {
        // Mostrar modo sugerencias
        heroSection.style.display = 'block';
        searchSection.style.display = 'none';
        resultsSection.style.display = 'none';
        btnHome.style.display = 'none';
        verTodosBtn.textContent = 'Ver Todos los Vehículos';
        mostrarSugerencias();
    }
}

// Inicializar datos cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarDatos);
} else {
    cargarDatos();
}

// Event listeners

document.getElementById('ver-todos').addEventListener('click', toggleModoBusqueda);

document.getElementById('busqueda').addEventListener('input', async (e) => {
    const texto = e.target.value;
    if (!texto.trim()) {
        const filtrados = filtrarPorOpciones(coches);
        mostrarCoches(filtrados);
        return;
    }

    const resultados = await buscarCoches(texto);
    mostrarCoches(resultados);
});

['filtro-combustible', 'filtro-año'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
        const texto = document.getElementById('busqueda').value;
        if (!texto.trim()) {
            const filtrados = filtrarPorOpciones(coches);
            mostrarCoches(filtrados);
        } else {
            const resultados = await buscarCoches(texto);
            mostrarCoches(resultados);
        }
    });
});

function actualizarTextoCategorias() {
    const seleccionadas = Array.from(document.querySelectorAll('.category-checkbox:checked')).map(input => input.value);
    const boton = document.getElementById('toggle-category-panel');
    if (!boton) return;
    boton.textContent = seleccionadas.length ? `Categorías (${seleccionadas.length}) ▾` : 'Categorías ▾';
}

function cerrarPanelCategoriasSiNecesario(event) {
    const panel = document.getElementById('category-panel');
    const boton = document.getElementById('toggle-category-panel');
    if (!panel || !boton) return;
    if (panel.classList.contains('hidden')) return;
    if (!panel.contains(event.target) && !boton.contains(event.target)) {
        panel.classList.add('hidden');
    }
}

document.querySelectorAll('.category-checkbox').forEach(input => {
    input.addEventListener('change', async () => {
        actualizarTextoCategorias();
        const texto = document.getElementById('busqueda').value;
        if (!texto.trim()) {
            const filtrados = filtrarPorOpciones(coches);
            mostrarCoches(filtrados);
        } else {
            const resultados = await buscarCoches(texto);
            mostrarCoches(resultados);
        }
    });
});

document.getElementById('toggle-category-panel').addEventListener('click', () => {
    const panel = document.getElementById('category-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    actualizarTextoCategorias();
});

document.addEventListener('click', cerrarPanelCategoriasSiNecesario);

document.addEventListener('DOMContentLoaded', actualizarTextoCategorias);

document.getElementById('btn-home').addEventListener('click', () => {
    toggleModoBusqueda();
});

document.getElementById('limpiar-comparador').addEventListener('click', () => {
    comparados = [];
    mostrarComparador();
});

document.getElementById('checkout-button').addEventListener('click', () => {
    if (!carrito.length) return;
    const nombres = carrito.map(c => `${c.marca} ${c.modelo}`).join(', ');
    alert(`¡Compra completada! Has comprado: ${nombres}. Gracias por tu pedido.`);
    carrito = [];
    actualizarCarrito();
});

    document.getElementById('btn-open-quiz')?.addEventListener('click', abrirQuiz);
    document.getElementById('quiz-start-button')?.addEventListener('click', iniciarQuiz);
    document.getElementById('quiz-close-button')?.addEventListener('click', cerrarQuiz);

