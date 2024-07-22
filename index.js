const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');// Different file interactions, like creating new file wth some texts, deleting, reading,etc.
const path = require('path');

const app = express();
app.use(express.static('uploads'))// Its a the static directory, here "uploads", now, declaring this means, we are allowing requests coming from UI to access the uploads folder for images. Basically this line serves the requests.

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

mongoose.connect("mongodb://localhost:27017/oscurobookDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("MongoDB Connection failed with", err));

const oscurobookSchema = new mongoose.Schema({
    postImage: String,
    postText: String,
    userName: String,
    postLikes: Number,
    timestamp: String
});

const postCommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Oscurobook', required: true },
    rootMessage: { type: String, required: true },
    userName: { type: String, required: true },
    rootCommentLikes: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  });

const PostComment = mongoose.model('PostComment', postCommentSchema);
const Oscurobook = mongoose.model('Oscurobook', oscurobookSchema);

app.get('/fetchPosts', async (req,res) => {
    try{
        // ???*** To fix this issue, you need to await the execution of the query and retrieve the actual data from the database before sending it as a response. You can do this by adding await before Licurbook.find():
        await Oscurobook.find()
        .then(allPosts => res.json(allPosts))
        .catch(err => console.log(err))
        
    }catch (error) {
        console.error('Error fetching examples:', error);
        log.Error('Error fetching examples:', error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getLikes/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
            await Oscurobook.findById(postId)
            .then(response => res.json(response))
            .catch(err => console.log(err))
            
    }catch (error) {
        console.error('Error fetching examples:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});
app.get('/getPostRootComments/:postId', async (req, res) => {
    try {
            const { postId } = req.params;
            const comments = await PostComment.find({ postId });
            res.status(200).json({ postComments: comments });
            
    }catch (error) {
        console.error('Error fetching examples:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});

app.post('/updateLikes/:postId/:postLikes', async (req, res) => {
    
    try {
        const { postId, postLikes } = req.params;
        const updateLikes = await Oscurobook.updateOne(
            { _id: postId },
            { $set: { postLikes: postLikes } }
        );

        console.log(req.params)
        // Check if the post exists
        if (updateLikes.matchedCount === 0) {
            throw new Error('Post Not found');
        }

        // Return the updated like count
        res.json({ message: 'Post likes updated successfully' });
    } catch (error) {
        
        if (error.message === 'Post Not found') {
            // If the post doesn't exist, return a 404 error
            return res.status(404).json({ error: 'Post not found' });
        } else {
            console.log("error")
            // Handle other errors
            res.status(500).json({ error: 'Some error occurred', message: error.message });
        }
    }
});

app.post('/addRootComments/:postId', async (req,res) => {
    try{
        console.log(req.body);
        const { postId } = req.params;
        const { rootMessage, userName, rootCommentLikes, timestamp } = req.body;
        const newPostComment = new PostComment({
        postId: postId,
        rootMessage : rootMessage,
        userName: userName,
        commentLikes: rootCommentLikes,
        timestamp: timestamp
        })
        await newPostComment.save();
        res.status(200).json({ message: 'Post added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
// Route to handle form submission with file upload
app.post('/addPost', upload.single('postImage'), async (req, res) => {
    console.log(req.file);
    const { postText, userName, postLikes, timestamp } = req.body;
    try {
        const postImage = req.file ? req.file.path : null; // Store the file path in the database

        const newOscurobook = new Oscurobook({
            postImage: postImage,
            postText: postText,
            userName: userName,
            postLikes: postLikes,
            timestamp: timestamp
        });

        console.log(req.body)
        await newOscurobook.save();
        res.status(200).json({ message: 'Post added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
