const express = require('express');
const UploadController = require('../controllers/uploadController');
const router = express.Router();
const multer = require('multer');
const verifyTokens = require('../middlewares/verifyTokens');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/signedclass', verifyTokens, UploadController.getSignedUrl);
router.post('/a', verifyTokens, UploadController.uploadGet);
router.post('/', upload.single('file'), verifyTokens, UploadController.uploadVideo);


module.exports = router;