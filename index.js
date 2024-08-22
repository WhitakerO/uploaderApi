const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { exec } = require('child_process');
const cors = require('cors');

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hola mundo!');
});

app.use(cors({
    origin: '*', // Permite todas las solicitudes de cualquier dominio
    methods: 'POST, GET, PUT', // Permite solo métodos POST
}));

app.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    // Solo aceptar el webhook si es un push a la rama principal
    if (req.body.ref === 'refs/heads/main') {
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
