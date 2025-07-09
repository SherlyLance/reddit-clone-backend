import multer from 'multer'

const storage = multer.diskStorage({
    destination: "public",
    filename: (req, file, cb) => {
        let fileName = Date.now() + file.originalname
        cb(null, fileName)
    }
})

const mediaFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
        return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
};

const postUpload = multer({
    storage,
    fileFilter: mediaFileFilter,
    limits: 30 * 1024 * 1024
})

export default postUpload;