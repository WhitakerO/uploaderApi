const express = require('express');
const cors = require('cors');
const { exec } = require('child_process'); // Importa exec aquí

const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();

// Configura los límites de tamaño de las solicitudes
app.use(express.json({ limit: '10gb' })); // Ajusta según el tamaño esperado de archivos
app.use(express.urlencoded({ extended: true, limit: '10gb' })); // Ajusta según el tamaño esperado de archivos

app.use((req, res, next) => {
    req.setTimeout(7200000); // 2 horas
    res.setTimeout(7200000); // 2 horas
    next();
});

// Configura CORS
app.use(cors({
    origin: '*', // Permite todos los orígenes. Cambia según sea necesario para mayor seguridad
}));

// Rutas para cursos
app.use('/api/upload', uploadRoutes);

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

const startServer = async () => {
    const PORT = process.env.PORT || 3000;
    try {
        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

        // Configura el tiempo de espera del servidor
        server.setTimeout(6000000); // 100 minutos en milisegundos
    } catch (error) {
        console.error('Error al sincronizar con la base de datos:', error);
    }
};

app.post('/webhook', (req, res) => {
    // Solo aceptar el webhook si es un push a la rama principal
    if (req.body.ref === 'refs/heads/main' || req.body.ref === 'refs/heads/master') {
        console.log('Nuevo push detectado en la rama principal. Actualizando servidor...');
        // Comandos para hacer pull, instalar dependencias y reiniciar el servidor
        exec('git pull && npm install && pm2 restart all', (err, stdout, stderr) => {
            if (err) {
                console.error(`Error durante el pull: ${stderr}`);
                return res.sendStatus(500);
            }
            console.log(`Resultado del comando: ${stdout}`);
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(200);
    }
});

startServer();
