const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { URL } = require('url');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

const fs = require('fs');
const mime = require('mime-types');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
dotenv.config();

// Configurar AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const compressVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx265')
            .outputOptions([
                '-crf 28',
                '-preset veryfast',
                '-max_muxing_queue_size 1024',
                '-movflags +faststart',
                '-fflags +genpts',  // Genera timestamps de presentación
                '-vsync 2'  // Ajusta la sincronización del video
            ])
            .save(outputPath)
            .on('end', () => {
                console.log('Video compression completed.');
                resolve();
            })
            .on('error', (error, stdout, stderr) => {
                console.error('Error compressing the video:', error);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                reject(error);
            });
    });
};

const isVideoFile = (filePath) => {
    const mimeType = mime.lookup(filePath);
    return mimeType && mimeType.startsWith('video/');
};

class UploadService {

    static async getSignedUrl(link) {
        if (!link) {
            throw new Error('No llegó un link');
        }

        const parsedUrl = new URL(link);
        let key = decodeURIComponent(parsedUrl.pathname.substring(1)); // Extraer la clave del objeto
        key = key.replace(/\+/g, ' '); // Reemplazar '+' por espacio

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Expires: 60 // La URL expira en 60 segundos
        };

        return new Promise((resolve, reject) => {
            s3.getSignedUrl('getObject', params, (err, signedUrl) => {
                if (err) {
                    reject(new Error('Error generando URL firmada'));
                } else {
                    console.log('signed URL', signedUrl);
                    resolve(signedUrl);
                }
            });
        });
    };

    static async uploadToS3(file, userId) {
        // Lista de extensiones permitidas
        const allowedExtensions = [
            // Documentos y Presentaciones
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.html', '.txt', '.csv',
            
            // Imágenes y Gráficos
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.tif',
            
            // Formatos RAW
            '.heic', '.dng', '.cr2', '.nef', '.arw', '.orf', '.rw2',
            
            // Vídeo
            '.mp4', '.mov', '.avi', '.mkv',
            
            // Audio
            '.mp3', '.wav', '.aac',
            
            // Archivos Comprimidos
            '.zip', '.rar',
            
            // Ebooks
            '.epub', '.mobi'
          ];

        // Obtener la extensión del archivo
        const fileExtension = path.extname(file.originalname).toLowerCase();

        // Verificar si la extensión está permitida
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error('El tipo de archivo no está permitido');
        }

        // Guarda el archivo temporalmente para procesarlo
        const tempFilePath = path.join('/tmp', `${Date.now()}_${file.originalname}`);
        fs.writeFileSync(tempFilePath, file.buffer);

        try {
            const isVideo = isVideoFile(tempFilePath);
            let uploadPath = tempFilePath;

            if (isVideo) {
                const compressedFilePath = path.join('/tmp', `compressed_${Date.now()}_${file.originalname}`);
                await compressVideo(tempFilePath, compressedFilePath);
                uploadPath = compressedFilePath;
            }

            const uploadResult = await UploadService.uploadFileToS3(uploadPath, file.mimetype);

            // Borra los archivos temporales
            fs.unlinkSync(tempFilePath);
            if (isVideo) fs.unlinkSync(uploadPath);

            return uploadResult;
        } catch (error) {
            fs.unlinkSync(tempFilePath);
            throw error;
        }
    }

    static async uploadFileToS3(filePath, mimeType) {
        const fileStream = fs.createReadStream(filePath);
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${Date.now()}_${path.basename(filePath)}`,
            Body: fileStream,
            ContentType: mimeType
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data.Location);
            });
        });
    }
}

module.exports = UploadService;
