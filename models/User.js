const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  transcripts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcript'
  }]
})

module.exports = mongoose.model('User', UserSchema, 'Users');