const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');// Different file interactions, like creating new file wth some texts, deleting, reading,etc.
const path = require('path');

const app = express();
app.use(express.static('uploads'))//???????????????

const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

if(!fs.existsSync('uploads/')){
    fs.mkdirSync('uploads/');
}
// Multer Middleware configuration process the form data and handle file uploads in Local System
// The upload.single('postImage') middleware is configured to expect a single file upload with the field name 'postImage'. Multer will look for this field name in the incoming form data.
const storage = multer.diskStorage({
    // "diskStorage provide few functions like, destination. Here req is what we got from UI, and there wes earch for the "postImage" key, and store it in uploads/
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define the destination directory for storing uploads
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Define the filename for storing uploads
    }
});

const upload = multer({ storage: storage });

mongoose.connect("mongodb://localhost:27017/licurbookDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("MongoDB Connection failed with", err));
const licurbookSchema = new mongoose.Schema({
    postImage: String,
    postText: String,
    userName: String,
    postLikes: Number,
    timestamp: String
});

const Licurbook = mongoose.model('Licurbook', licurbookSchema);

app.get('/fetchPosts', async (req,res) => {
    try{
        // ???*** To fix this issue, you need to await the execution of the query and retrieve the actual data from the database before sending it as a response. You can do this by adding await before Licurbook.find():
        const allPosts = await Licurbook.find()
        .then(result => res.json(result))
        .catch(err => console.log(err))
        
    }catch (error) {
        console.error('Error fetching examples:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
})


// Route to handle form submission with file upload
app.post('/addPost', upload.single('postImage'), async (req, res) => {
    console.log(req.file);
    const { postText, userName, postLikes, timestamp } = req.body;
    try {
        const postImage = req.file ? req.file.path : null; // Store the file path in the database

        const newLicurbook = new Licurbook({
            postImage: postImage,
            postText: postText,
            userName: userName,
            postLikes: postLikes,
            timestamp: timestamp
        });

        console.log(req.body)
        await newLicurbook.save();
        res.status(200).json({ message: 'Post added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
