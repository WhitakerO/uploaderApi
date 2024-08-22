const express = require('express');
const UploadController = require('../controllers/uploadController');
const router = express.Router();
const multer = require('multer');
const verifyTokens = require('../middlewares/verifyTokens');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/signedclass', verifyTokens, UploadController.getSignedUrl);
router.post('/', upload.single('file'), verifyTokens, UploadController.uploadVideo);
router.get('/', verifyTokens, UploadController.uploadGet);

module.exports = router;