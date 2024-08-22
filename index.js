const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['*']
}));

app.use('/api/upload', uploadRoutes); // Rutas para cursos


app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});
const startServer = async () => {
    const PORT = process.env.PORT || 3000;
    try {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al sincronizar con la base de datos:', error);
    }
}
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
})
startServer();