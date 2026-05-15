let coches = [];
let comparados = [];
let carrito = [];
let resultadosActuales = [];
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

// 2. Detectar si el usuario está logueado
if (firebaseInitialized && auth) {
    auth.onAuthStateChanged(user => {
        console.log("Estado de autenticación cambiado:", user ? "Usuario logueado" : "Usuario no logueado");
        const authUI = document.getElementById('auth-ui');
        if (user) {
            console.log("Usuario:", user.displayName, user.email);
            authUI.innerHTML = `
                <div class="user-info">
                    <span>Hola, ${user.displayName.split(' ')[0]}</span>
                    <img src="${user.photoURL}" alt="Foto de perfil">
                    <button onclick="logout()">Salir</button>
                </div>`;
            cargarDatosUsuario();
        } else {
            authUI.innerHTML = `<button class="btn-google" onclick="login()">Entrar con Google</button>`;
            // Limpiar datos locales si no hay usuario
            carrito = [];
            actualizarCarrito();
        }
    });
} else {
    // Modo sin Firebase
    console.log("⚠️ Firebase no inicializado - mostrando UI básica");
    const authUI = document.getElementById('auth-ui');
    authUI.innerHTML = `<button class="btn-secondary" onclick="alert('Firebase no configurado. Revisa la consola para instrucciones.')">Login (No disponible)</button>`;
}
// 3. Cargar datos del usuario desde Firestore
async function cargarDatosUsuario() {
    if (!firebaseInitialized || !auth || !db) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = db.collection('usuarios').doc(user.uid);
        const doc = await userRef.get();
        if (doc.exists) {
            const data = doc.data();
            carrito = data.carrito || [];
            // Aquí puedes cargar favoritos si los tienes
            actualizarCarrito();
        }
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// 4. Guardar datos del usuario en Firestore
async function guardarDatosUsuario() {
    if (!firebaseInitialized || !auth || !db) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        await db.collection('usuarios').doc(user.uid).set({
            carrito: carrito,
            // Agrega más campos como favoritos si los implementas
        }, { merge: true });
    } catch (error) {
        console.error("Error guardando datos:", error);
    }
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
    await cargarCochesLocales();
    await cargarMarcasVpic();
    mostrarSugerencias();
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
    guardarDatosUsuario(); // Guardar en Firestore
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
    alert(`${coche.marca} ${coche.modelo} añadido a la cesta.`);
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
    guardarDatosUsuario(); // Guardar en Firestore
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarrito();
    guardarDatosUsuario(); // Guardar en Firestore
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
                <button class="fav-btn" onclick="toggleFav('${coche.marca} ${modelo}')">♥</button>
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

    comparados.forEach((coche, idx) => {
        const año = coche.año || 'No disponible';
        const cilindros = coche.cilindros || 'N/A';
        const potencia = coche.potencia ? `${coche.potencia} HP` : 'N/A';
        const combustible = coche.combustible || 'N/A';
        const traccion = coche.traccion || 'N/A';
        const carroceria = coche.carroceria || 'N/A';
        const precio = coche.precio ? `$${coche.precio.toLocaleString()}` : 'Precio no disponible';
        const imagenHTML = construirImgCarImages(coche, 'comparador-imagen', 200, 150);

        comp.innerHTML += `
            <div>
                ${imagenHTML}
                <h4>${coche.marca} ${coche.modelo || ''}</h4>
                <p><strong>📅 Año:</strong> ${año}</p>
                <p><strong>⚙️ Motor:</strong> ${cilindros} cilindros</p>
                <p><strong>💨 Potencia:</strong> ${potencia}</p>
                <p><strong>⛽ Combustible:</strong> ${combustible}</p>
                <p><strong>🔄 Tracción:</strong> ${traccion}</p>
                <p><strong>📦 Carrocería:</strong> ${carroceria}</p>
                <p><strong>💰 Precio:</strong> ${precio}</p>
                <button onclick="eliminarComparador(${idx})" style="background: #e74c3c; color: white; padding: 8px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; width: 100%;">Eliminar</button>
                <hr>
            </div>
        `;
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

cargarDatos();

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

document.querySelectorAll('.category-checkbox').forEach(input => {
    input.addEventListener('change', async () => {
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
    document.getElementById('category-panel').classList.toggle('hidden');
});

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

window.addEventListener('load', () => {
    actualizarCarrito();
});
