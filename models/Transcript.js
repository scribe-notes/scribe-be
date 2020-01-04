const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Untitled Transcript"
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  // This is the time it took to record this transcript
  // in seconds
  recordingLength: {
    type: Number
  },
  // This is the transcript itself - It is not required
  // as this could be a group of transcripts
  data: {
    type: String
  },
  // Is this a parent directory to a group of transcripts?
  isGroup: {
    type: Boolean,
    default: false
  },
  // This is populated if this transcript is marked as a
  // group of transcripts (a folder)
  group: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transcript"
    }
  ],
  // Who else has access to this transcript?
  sharedWith: [
    {
      // User ID
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      // Can this user edit this transcript?
      edit: {
        type: Boolean,
        default: false
      }
    }
  ]
});

module.exports = mongoose.model("Transcript", TranscriptSchema, "Transcripts");
