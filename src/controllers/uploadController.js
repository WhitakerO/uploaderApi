const UploadService = require('../services/uploadService');

class UploadController {
    static async uploadVideo(req, res) {
        try {
            const file = req.file;
            const fileLink = await UploadService.uploadToS3(file, req.user.id);
            res.json({ fileLink });
        } catch (error) {
            console.error('Error uploading the video', error);
            res.status(500).send(`Error uploading the video: ${error}`);
        }
    };
    static async uploadGet(req, res) {
        try {
            res.send('Upload good');
        } catch (error) {
            res.send('Hola con error');
        }
    };
    static async getSignedUrl(req, res) {
        try {
            const signedUrl = await UploadService.getSignedUrl(req.query.videoUrl);
            console.log('signed URL 2', signedUrl)
            res.status(200).json(signedUrl);
        } catch (error) {
            console.error('Error signing url', error);
            res.status(500).send('Error signing url', error);
        }
    };
}

module.exports = UploadController;
