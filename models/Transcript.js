const mongoose = require('mongoose');

const TranscriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Transcript'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // This is the time it took to record this transcript
  // in seconds
  recordingLength: {
    type: Number,
    required: true,
  },
  data: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model('Transcript', TranscriptSchema, 'Transcripts');