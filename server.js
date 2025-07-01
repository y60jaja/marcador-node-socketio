// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// --- Configuración para servir archivos estáticos ---
// Sirve la carpeta 'html' y sus subcarpetas
app.use(express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/Img', express.static(path.join(__dirname, 'Img')));


// --- Variables de estado del marcador (para Socket.IO) ---
// Objeto para almacenar el estado de CADA marcador, usando su ID como clave.
// Ejemplo: { 'marcadores1': { ...datos... }, 'marcadores2': { ...datos... } }
const allScoreboardsData = {};

// Función para inicializar los datos de un nuevo marcador si no existen
function initializeScoreboard(marcadorId) {
    if (!allScoreboardsData[marcadorId]) {
        console.log(`Inicializando datos para el marcador: ${marcadorId}`);
        allScoreboardsData[marcadorId] = {
            id: marcadorId, // Añade el ID al objeto de datos
            team1Name: 'Equipo A', // Valores por defecto
            score1: 0,
            team2Name: 'Equipo B',
            score2: 0,
            totalSeconds: 0,
            gameTime: '00:00',
            gameStatus: 'Iniciando Juego'
        };
    }
    return allScoreboardsData[marcadorId];
}

// --- Manejo de Conexiones y Eventos de Socket.IO ---
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Cuando un cliente se conecta, podemos asumir que aún no sabemos a qué marcador pertenece.
    // Esperaremos a que el cliente nos envíe su ID de marcador con la primera actualización.
    // Sin embargo, para dar un estado inicial, podríamos necesitar una ruta específica
    // o que el cliente emita un evento 'requestScoreboardData' con su ID al conectar.

    // Por ahora, el cliente simplemente recibirá el estado por defecto o el último conocido
    // para el ID que pida. El `updateDisplay` del cliente se encargará de ignorar
    // los datos si el ID no coincide.

    // 2. Escucha el evento 'updateScoreboard' que viene del cliente (panel de control).
    // Ahora, `data` contendrá `id`, `team1Name`, `score1`, etc.
    socket.on('updateScoreboard', (data) => {
        const marcadorId = data.id; // ¡Obtenemos el ID del marcador de los datos!

        if (!marcadorId) {
            console.warn('Actualización recibida sin ID de marcador. Ignorando.');
            return;
        }

        // Asegurarse de que el marcador existe, inicializándolo si es necesario
        initializeScoreboard(marcadorId);

        console.log(`Datos recibidos para el marcador ${marcadorId}:`, data);

        // Actualiza el estado del marcador ESPECÍFICO en el servidor.
        const currentScoreboard = allScoreboardsData[marcadorId];

        if (data.team1Name !== undefined) currentScoreboard.team1Name = data.team1Name;
        if (data.score1 !== undefined) currentScoreboard.score1 = data.score1;
        if (data.team2Name !== undefined) currentScoreboard.team2Name = data.team2Name;
        if (data.score2 !== undefined) currentScoreboard.score2 = data.score2;
        if (data.gameStatus !== undefined) currentScoreboard.gameStatus = data.gameStatus;

        if (typeof data.totalSeconds !== 'undefined') {
            currentScoreboard.totalSeconds = data.totalSeconds;
            const minutes = Math.floor(data.totalSeconds / 60);
            const remainingSeconds = data.totalSeconds % 60;
            currentScoreboard.gameTime = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        } else if (data.gameTime) {
            const parts = data.gameTime.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                currentScoreboard.totalSeconds = (minutes * 60) + seconds;
                currentScoreboard.gameTime = data.gameTime;
            }
        }
        
        // Emite la actualización a *TODOS* los clientes conectados.
        // CADA CLIENTE filtrará los datos si su ID no coincide.
        io.emit('scoreboardUpdated', currentScoreboard); // Envía el estado actualizado del marcador ESPECÍFICO
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });

    // *** Nuevo: Manejar la solicitud de datos iniciales por ID ***
    // Cuando un cliente se conecta, no sabe su ID hasta que el JS se ejecuta.
    // Una vez que el `script_mar.js` obtiene su `marcadorId`, puede solicitar los datos iniciales.
    socket.on('requestInitialScoreboardData', (marcadorId) => {
        console.log(`Cliente ${socket.id} solicita datos para el marcador: ${marcadorId}`);
        // Asegúrate de que el marcador exista y esté inicializado
        const initialData = initializeScoreboard(marcadorId);
        // Envía los datos iniciales SÓLO a este socket que los solicitó.
        socket.emit('currentScoreboardData', initialData);
    });
});


// --- Definición de Rutas de Páginas HTML ---

// Sirve las páginas HTML dinámicamente desde sus subcarpetas
// Esto asegura que /html/marcadores1/marcador.html funcione y obtenga 'marcadores1' como ID
app.get('/html/:marcadorFolder/:htmlFile', (req, res) => {
    const marcadorFolder = req.params.marcadorFolder;
    const htmlFile = req.params.htmlFile;
    // Asegurarse de que el htmlFile es el esperado (e.g., marcador.html)
    if (htmlFile === 'marcador.html') {
        res.sendFile(path.join(__dirname, 'html', marcadorFolder, htmlFile));
    } else {
        res.status(404).send('Archivo no encontrado.');
    }
});

// Ruta principal, puedes redirigir a una página de selección si quieres
app.get('/', (req, res) => {
    // Puedes enviar un index.html con links a cada marcador o redirigir
    // Por ahora, redirigimos a marcador1 como ejemplo
    res.redirect('/html/marcadores1/marcador.html');
});


// Rutas para otros tipos de marcadores si tienes HTMLs específicos en la carpeta 'html'
// NOTA: Con la nueva ruta '/html/:marcadorFolder/:htmlFile', si tus 'marcadoresX'
// son los únicos que usan 'marcador.html', estas rutas podrían ser redundantes.
// Si tienes otros HTMLs (bskt.html, tenis.html) directamente en la carpeta 'html'
// Y no dentro de subcarpetas como 'marcadores1', entonces estas rutas son necesarias.
app.get('/entrada.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'entrada.html'));
});
app.get('/index.html', (req, res) => { // Asegúrate de que index.html es accesible
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

// Si 'bskt.html', 'tenis.html', etc., están en la raíz de 'html'
app.get('/:htmlFile', (req, res) => {
    const htmlFile = req.params.htmlFile;
    if (htmlFile.endsWith('.html')) { // Solo permitir archivos .html
        res.sendFile(path.join(__dirname, 'html', htmlFile));
    } else {
        res.status(404).send('Archivo no encontrado.');
    }
});


server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log('Accede a los marcadores únicos, por ejemplo:');
    console.log(` - http://localhost:${PORT}/html/marcadores1/marcador.html`);
    console.log(` - http://localhost:${PORT}/html/marcadores2/marcador.html`);
    console.log(` - http://localhost:${PORT}/html/marcadores3/marcador.html`);
    console.log(` - http://localhost:${PORT}/html/marcadores4/marcador.html`);
});