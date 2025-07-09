import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: "public",
    filename: function (req, file, cb) {
        let extension = path.extname(file.originalname)
        cb(null, `community${extension}`)
    }
})

const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter: imageFileFilter,
})

export default upload;