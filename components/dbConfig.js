const mongoose = require('mongoose');

// Here we have to define the list of Schema, or the tables
const TimelineSchema = new mongoose.Schema({
    postImage: String,
    postText: String,
    userName: String,
    postLikes: Number,
    timestamp: String
});


const TimelinePosts = mongoose.model('Licurbook', TimelineSchema);
module.exports = TimelinePosts