// ==========================================
// 1. FECHA DE INICIO
// ==========================================
// Recuerda: Enero es 0, Febrero es 1, ..., Junio es 5.
const fechaInicio = new Date(2025, 5, 7, 15, 30, 0); 

// ==========================================
// 2. LÓGICA DEL CONTADOR
// ==========================================
function actualizarContador() {
    const ahora = new Date();
    
    let anios = ahora.getFullYear() - fechaInicio.getFullYear();
    let meses = ahora.getMonth() - fechaInicio.getMonth();
    let dias = ahora.getDate() - fechaInicio.getDate();
    let horas = ahora.getHours() - fechaInicio.getHours();
    let minutos = ahora.getMinutes() - fechaInicio.getMinutes();
    let segundos = ahora.getSeconds() - fechaInicio.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }
    
    if (dias < 0) {
        const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0).getDate();
        dias += mesAnterior;
        meses--;
    }
    
    if (meses < 0) {
        meses += 12;
        anios--;
    }

    const timerHTML = `
        <div class="timer-main">
            <span class="number">${anios}</span><span class="unit">años</span>
            <span class="number">${meses}</span><span class="unit">meses</span>
            <span class="number">${dias}</span><span class="unit">días</span>
        </div>
        <div class="timer-sub">
            ${horas}h ${minutos}m ${segundos}s
        </div>
    `;

    document.getElementById('timer').innerHTML = timerHTML;
}

setInterval(actualizarContador, 1000);
actualizarContador();

// ==========================================
// 3. CURSOR DE CORAZONES
// ==========================================
document.addEventListener('mousemove', (e) => {
    const heart = document.createElement('span');
    heart.innerHTML = '❤';
    heart.classList.add('heart');
    
    heart.style.left = e.clientX + 'px';
    heart.style.top = e.clientY + 'px';
    
    const size = Math.random() * 15 + 10;
    heart.style.fontSize = size + 'px';

    document.body.appendChild(heart);

    setTimeout(() => { heart.remove(); }, 1500);
});

// ==========================================
// 4. REPRODUCTOR DE MÚSICA DE YOUTUBE
// ==========================================
// ¡Aquí puedes agregar o cambiar cualquier canción!
// Puedes poner solo el enlace de YouTube o un objeto con título y artista:
const canciones = [
    {
        titulo: "Mi Persona Favorita",
        artista: "Alejandro Sanz & Camila Cabello",
        url: "https://www.youtube.com/watch?v=W4AiOKlOO0Q"
    },
    {
        titulo: "Until I Found You",
        artista: "Stephen Sanchez",
        url: "https://www.youtube.com/watch?v=GxldQ9eX2wo"
    },
    {
        titulo: "Perfect",
        artista: "Ed Sheeran",
        url: "https://www.youtube.com/watch?v=2Vv-BfVoq4g"
    },
    {
        titulo: "Yellow",
        artista: "Coldplay",
        url: "https://www.youtube.com/watch?v=yKNxeF4KMsY"
    }
];

let indiceActual = 0;
let player = null;
let isPlayerReady = false;
let updateInterval = null;
let isDragging = false;
let pendingPlay = false;

// Elementos DOM
const musicPlayerEl = document.querySelector('.music-player');
const musicBtn = document.getElementById('music-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const icon = document.getElementById('music-icon');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const volumeSlider = document.getElementById('volume-slider');
const songTitleEl = document.getElementById('music-song-title');
const artistNameEl = document.getElementById('music-artist-name');
const toggleVideoBtn = document.getElementById('toggle-video-btn');
const videoContainer = document.getElementById('music-video-container');

// Detectar si es un iPhone/iPad (iOS)
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (esIOS && volumeSlider) {
    volumeSlider.style.display = 'none';
}

function formatearTiempo(segundos) {
    if (isNaN(segundos) || segundos < 0) return "0:00";
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

// Extraer ID del video de YouTube desde cualquier formato de enlace
function extraerVideoId(cancion) {
    if (!cancion) return "";
    let url = typeof cancion === "object" ? cancion.url || "" : cancion;
    url = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : url;
}

function obtenerInfoCancion(index) {
    const item = canciones[index];
    if (!item) return { titulo: "Nuestra Canción", artista: "YouTube" };
    if (typeof item === "object") {
        return {
            titulo: item.titulo || "Nuestra Canción",
            artista: item.artista || "YouTube"
        };
    }
    return { titulo: `Canción ${index + 1}`, artista: "YouTube" };
}

function actualizarInfoUI() {
    const info = obtenerInfoCancion(indiceActual);
    if (songTitleEl) songTitleEl.innerText = info.titulo;
    if (artistNameEl) artistNameEl.innerText = info.artista;
}

// Inicialización de la API de YouTube
window.onYouTubeIframeAPIReady = function() {
    actualizarInfoUI();
    const primerId = extraerVideoId(canciones[indiceActual]);
    
    player = new YT.Player('yt-player', {
        videoId: primerId,
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'playsinline': 1, // Crucial para móviles (evita pantalla completa automática)
            'rel': 0,
            'modestbranding': 1,
            'enablejsapi': 1,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady() {
    isPlayerReady = true;
    if (volumeSlider && !esIOS) {
        player.setVolume(volumeSlider.value * 100);
    }
    actualizarInfoUI();

    if (pendingPlay) {
        pendingPlay = false;
        player.playVideo();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        if (icon) icon.innerHTML = '⏸';
        if (musicPlayerEl) musicPlayerEl.classList.add('playing');
        iniciarSeguimientoProgreso();

        // Si el título es genérico y YouTube nos da los metadatos reales
        try {
            const videoData = player.getVideoData ? player.getVideoData() : null;
            if (videoData && videoData.title && typeof canciones[indiceActual] === 'string') {
                if (songTitleEl) songTitleEl.innerText = videoData.title;
                if (artistNameEl) artistNameEl.innerText = videoData.author || "YouTube";
            }
        } catch (e) {
            // Ignorar si el navegador restringe acceso a videoData
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        if (icon) icon.innerHTML = '♫';
        if (musicPlayerEl) musicPlayerEl.classList.remove('playing');
        detenerSeguimientoProgreso();
    } else if (event.data === YT.PlayerState.ENDED) {
        detenerSeguimientoProgreso();
        siguienteCancion();
    }
}

function onPlayerError(error) {
    console.warn("Aviso al reproducir video de YouTube:", error);
    // Si un video tiene restricciones, pasa automáticamente al siguiente
    siguienteCancion();
}

function cambiarCancion(nuevoIndice) {
    indiceActual = (nuevoIndice + canciones.length) % canciones.length;
    actualizarInfoUI();
    const videoId = extraerVideoId(canciones[indiceActual]);
    if (player && isPlayerReady && player.loadVideoById) {
        player.loadVideoById(videoId);
    }
}

function siguienteCancion() {
    cambiarCancion(indiceActual + 1);
}

function anteriorCancion() {
    cambiarCancion(indiceActual - 1);
}

// Botones de control
if (musicBtn) {
    musicBtn.addEventListener('click', () => {
        if (!player || !isPlayerReady) {
            pendingPlay = true;
            return;
        }
        const state = player.getPlayerState ? player.getPlayerState() : -1;
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });
}

if (nextBtn) nextBtn.addEventListener('click', siguienteCancion);
if (prevBtn) prevBtn.addEventListener('click', anteriorCancion);

// Seguimiento del progreso y tiempo transcurrido
function iniciarSeguimientoProgreso() {
    detenerSeguimientoProgreso();
    updateInterval = setInterval(() => {
        if (player && isPlayerReady && typeof player.getCurrentTime === 'function') {
            const currentTime = player.getCurrentTime() || 0;
            const duration = player.getDuration() || 0;
            
            if (!isDragging && duration > 0) {
                progressBar.max = duration;
                progressBar.value = currentTime;
                if (currentTimeEl) currentTimeEl.innerText = formatearTiempo(currentTime);
                if (totalTimeEl) totalTimeEl.innerText = formatearTiempo(duration);
            }
        }
    }, 400);
}

function detenerSeguimientoProgreso() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Control manual del control deslizante de progreso
if (progressBar) {
    progressBar.addEventListener('input', () => {
        isDragging = true;
        if (currentTimeEl) currentTimeEl.innerText = formatearTiempo(progressBar.value);
    });

    const soltarBarra = () => {
        if (isDragging && player && isPlayerReady && typeof player.seekTo === 'function') {
            player.seekTo(Number(progressBar.value), true);
            isDragging = false;
        }
    };

    progressBar.addEventListener('change', soltarBarra);
    progressBar.addEventListener('touchend', soltarBarra);
    progressBar.addEventListener('mouseup', soltarBarra);
}

// Control de volumen
if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        if (player && isPlayerReady && typeof player.setVolume === 'function') {
            player.setVolume(e.target.value * 100);
            if (player.isMuted()) player.unMute();
        }
    });
}

// Botón para desplegar / ocultar la mini pantalla de video
if (toggleVideoBtn && videoContainer) {
    toggleVideoBtn.addEventListener('click', () => {
        videoContainer.classList.toggle('minimized');
        toggleVideoBtn.classList.toggle('active');
        if (videoContainer.classList.contains('minimized')) {
            toggleVideoBtn.title = "Mostrar video";
        } else {
            toggleVideoBtn.title = "Ocultar video";
        }
    });
}

// ==========================================
// 5. ANIMACIONES AL HACER SCROLL
// ==========================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { 
            entry.target.classList.add('active'); 
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(section => { 
    observer.observe(section); 
});

// ==========================================
// 6. AJUSTE EXACTO DEL ANCHO DEL TEXTO EN LIGHTBOX
// ==========================================
function sincronizarAnchoCaption() {
    const lightboxActivo = document.querySelector('.lightbox:target');
    if (!lightboxActivo) return;

    const img = lightboxActivo.querySelector('.lightbox-content img');
    const caption = lightboxActivo.querySelector('.lightbox-caption');

    if (img && caption) {
        const aplicarAncho = () => {
            if (img.clientWidth > 0) {
                caption.style.maxWidth = `${img.clientWidth}px`;
            }
        };

        if (img.complete && img.clientWidth > 0) {
            aplicarAncho();
        } else {
            img.onload = aplicarAncho;
        }
    }
}

window.addEventListener('hashchange', () => {
    setTimeout(sincronizarAnchoCaption, 50);
});
window.addEventListener('resize', sincronizarAnchoCaption);

document.querySelectorAll('.polaroid-wrapper').forEach(enlace => {
    enlace.addEventListener('click', () => {
        setTimeout(sincronizarAnchoCaption, 50);
    });
});

// ==========================================
// 7. LÓGICA DE NUESTRO DIARIO DE RECUERDOS
// ==========================================
(function inicializarDiario() {
    const STORAGE_KEY = 'diario_recuerdos_regalito';

    // Elementos DOM
    const prevBtn = document.getElementById('diary-prev-btn');
    const nextBtn = document.getElementById('diary-next-btn');
    const newBtn = document.getElementById('diary-new-btn');
    const pageIndicator = document.getElementById('diary-page-indicator');

    const dateInput = document.getElementById('diary-date-input');
    const dateDisplay = document.getElementById('diary-date-display');
    const moodSelect = document.getElementById('diary-mood-select');
    const titleInput = document.getElementById('diary-title-input');
    const contentInput = document.getElementById('diary-content-input');
    const stickersLayer = document.getElementById('diary-stickers-layer');
    const stickersTray = document.getElementById('stickers-tray');

    const saveBtn = document.getElementById('diary-save-btn');
    const deleteBtn = document.getElementById('diary-delete-btn');
    const toast = document.getElementById('diary-toast');

    if (!contentInput || !saveBtn) return; // Si no está en el DOM

    // Helper: Formato YYYY-MM-DD para hoy
    function obtenerFechaHoy() {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m = String(hoy.getMonth() + 1).padStart(2, '0');
        const d = String(hoy.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Helper: Formatear fecha bonita en español
    function formatearFechaEspanol(fechaStr) {
        if (!fechaStr) return '';
        const partes = fechaStr.split('-');
        if (partes.length !== 3) return fechaStr;
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        const fecha = new Date(anio, mes, dia);
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const formateada = fecha.toLocaleDateString('es-ES', opciones);
        return formateada.charAt(0).toUpperCase() + formateada.slice(1);
    }

    // Toast de aviso
    function mostrarToast(mensaje) {
        if (!toast) return;
        toast.innerText = mensaje;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Cargar entradas de localStorage o crear la primera
    let entradas = [];
    try {
        const dataGuardada = localStorage.getItem(STORAGE_KEY);
        if (dataGuardada) {
            entradas = JSON.parse(dataGuardada);
        }
    } catch (e) {
        entradas = [];
    }

    if (!entradas || entradas.length === 0) {
        entradas = [
            {
                id: '1',
                date: obtenerFechaHoy(),
                mood: '🥰',
                title: 'Nuestro primer recuerdo en el diario 💕',
                content: 'Hoy es un hermoso día para escribir en nuestro diario. Gracias por llenar mi vida de sonrisas, momentos mágicos y tanto amor. ¡Aquí guardaremos todos nuestros recuerdos especiales! ✨',
                stickers: [
                    { emoji: '💖', top: 12, left: 82, rot: 8 },
                    { emoji: '🌸', top: 70, left: 8, rot: -10 },
                    { emoji: '✨', top: 18, left: 10, rot: 12 }
                ]
            }
        ];
    }

    let indiceActual = 0;

    function guardarEnStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entradas));
        } catch (e) {
            console.error("Error al guardar en localStorage", e);
        }
    }

    // Renderizar stickers en la capa
    function renderizarStickers() {
        stickersLayer.innerHTML = '';
        const entrada = entradas[indiceActual];
        if (!entrada || !entrada.stickers) return;

        entrada.stickers.forEach((s, idx) => {
            const span = document.createElement('span');
            span.classList.add('placed-sticker');
            span.innerText = s.emoji;
            span.style.top = `${s.top}%`;
            span.style.left = `${s.left}%`;
            span.style.setProperty('--rot', `${s.rot || 0}deg`);
            span.title = 'Toca para quitar este sticker';

            // Al hacer clic sobre un sticker colocado, se remueve
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                entrada.stickers.splice(idx, 1);
                guardarEnStorage();
                renderizarStickers();
            });

            stickersLayer.appendChild(span);
        });
    }

    // Cargar la entrada actual en la UI
    function cargarEntradaActual() {
        if (indiceActual < 0) indiceActual = 0;
        if (indiceActual >= entradas.length) indiceActual = entradas.length - 1;

        const entrada = entradas[indiceActual];
        if (!entrada) return;

        // Fecha
        const fecha = entrada.date || obtenerFechaHoy();
        dateInput.value = fecha;
        dateDisplay.innerText = formatearFechaEspanol(fecha);

        // Sentimiento
        moodSelect.value = entrada.mood || '🥰';

        // Título y contenido
        titleInput.value = entrada.title || '';
        contentInput.value = entrada.content || '';

        // Indicador de página y estado de botones
        pageIndicator.innerText = `Página ${indiceActual + 1} de ${entradas.length}`;
        prevBtn.disabled = indiceActual === 0;
        nextBtn.disabled = indiceActual === entradas.length - 1;

        renderizarStickers();
    }

    // Actualizar datos de la entrada actual desde los inputs
    function sincronizarDatosActuales() {
        if (!entradas[indiceActual]) return;
        entradas[indiceActual].date = dateInput.value || obtenerFechaHoy();
        entradas[indiceActual].mood = moodSelect.value;
        entradas[indiceActual].title = titleInput.value;
        entradas[indiceActual].content = contentInput.value;
    }

    // Eventos de fecha
    dateInput.addEventListener('change', () => {
        dateDisplay.innerText = formatearFechaEspanol(dateInput.value);
        sincronizarDatosActuales();
    });

    // Eventos de cambios en texto y emoción
    moodSelect.addEventListener('change', sincronizarDatosActuales);
    titleInput.addEventListener('input', sincronizarDatosActuales);
    contentInput.addEventListener('input', sincronizarDatosActuales);

    // Botón Guardar
    saveBtn.addEventListener('click', () => {
        sincronizarDatosActuales();
        guardarEnStorage();
        mostrarToast('¡Recuerdo guardado con amor! 💖');

        // Pequeño efecto visual de corazoncitos extra
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const rect = saveBtn.getBoundingClientRect();
                const heart = document.createElement('span');
                heart.innerHTML = '❤';
                heart.classList.add('heart');
                heart.style.left = `${rect.left + Math.random() * rect.width}px`;
                heart.style.top = `${rect.top}px`;
                document.body.appendChild(heart);
                setTimeout(() => heart.remove(), 1500);
            }, i * 120);
        }
    });

    // Botón Nueva Página
    newBtn.addEventListener('click', () => {
        sincronizarDatosActuales();
        guardarEnStorage();

        const nueva = {
            id: Date.now().toString(),
            date: obtenerFechaHoy(),
            mood: '🥰',
            title: '',
            content: '',
            stickers: []
        };
        entradas.push(nueva);
        indiceActual = entradas.length - 1;
        guardarEnStorage();
        cargarEntradaActual();
        titleInput.focus();
        mostrarToast('¡Nueva página creada! ✨');
    });

    // Navegación Anterior
    prevBtn.addEventListener('click', () => {
        if (indiceActual > 0) {
            sincronizarDatosActuales();
            guardarEnStorage();
            indiceActual--;
            cargarEntradaActual();
        }
    });

    // Navegación Siguiente
    nextBtn.addEventListener('click', () => {
        if (indiceActual < entradas.length - 1) {
            sincronizarDatosActuales();
            guardarEnStorage();
            indiceActual++;
            cargarEntradaActual();
        }
    });

    // Botón Borrar Página
    deleteBtn.addEventListener('click', () => {
        if (entradas.length <= 1) {
            if (confirm('¿Deseas limpiar esta página del diario?')) {
                entradas[0].title = '';
                entradas[0].content = '';
                entradas[0].stickers = [];
                entradas[0].date = obtenerFechaHoy();
                entradas[0].mood = '🥰';
                guardarEnStorage();
                cargarEntradaActual();
                mostrarToast('Página limpiada');
            }
            return;
        }

        if (confirm('¿Estás seguro de que deseas eliminar esta página del diario?')) {
            entradas.splice(indiceActual, 1);
            if (indiceActual >= entradas.length) indiceActual = entradas.length - 1;
            guardarEnStorage();
            cargarEntradaActual();
            mostrarToast('Página eliminada');
        }
    });

    // Agregar stickers desde la bandeja
    if (stickersTray) {
        stickersTray.addEventListener('click', (e) => {
            const btn = e.target.closest('.sticker-opt');
            if (!btn) return;

            const emoji = btn.dataset.sticker;
            if (!emoji) return;

            const entrada = entradas[indiceActual];
            if (!entrada) return;
            if (!entrada.stickers) entrada.stickers = [];

            // Zonas decorativas alrededor de la hoja de libreta
            const zonas = [
                { topMin: 6, topMax: 20, leftMin: 72, leftMax: 88 },  // Esquina superior derecha
                { topMin: 6, topMax: 20, leftMin: 6, leftMax: 22 },   // Esquina superior izquierda
                { topMin: 68, topMax: 85, leftMin: 74, leftMax: 90 }, // Esquina inferior derecha
                { topMin: 68, topMax: 85, leftMin: 6, leftMax: 20 },  // Esquina inferior izquierda
                { topMin: 35, topMax: 55, leftMin: 80, leftMax: 92 }, // Borde lateral derecho
                { topMin: 35, topMax: 55, leftMin: 4, leftMax: 15 }   // Borde lateral izquierdo
            ];

            const zona = zonas[Math.floor(Math.random() * zonas.length)];
            const top = Math.floor(Math.random() * (zona.topMax - zona.topMin)) + zona.topMin;
            const left = Math.floor(Math.random() * (zona.leftMax - zona.leftMin)) + zona.leftMin;
            const rot = Math.floor(Math.random() * 30) - 15;

            entrada.stickers.push({ emoji, top, left, rot });
            guardarEnStorage();
            renderizarStickers();
        });
    }

    // Inicializar primera carga
    cargarEntradaActual();
})();
