const express = require("express");
const protected = require("../auth/protected");
const checkFields = require("../util/checkFields");
const updateFields = require("../util/updateFields");

const Transcript = require("../models/Transcript");
const User = require("../models/User");

const router = express.Router();

// Get all scripts belonging to token bearer
router.get("/mine", protected, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "Unable to find user!" });

    const response = await Promise.all(
      user._doc.transcripts.map(transcript => Transcript.findById(transcript))
    );

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

// Get a transcript by id
router.get("/:id", protected, (req, res) => {
  Transcript.findById(req.params.id).then(transcript => {
    if (!transcript)
      return res
        .status(404)
        .json({ message: "A transcript with that ID does not exist!" });

    // Users with access to this transcript
    const whitelist = transcript._doc.sharedWith.map(userId => {
      userId.toString();
    });

    if (
      transcript._doc.creator.toString() !== req.user.id ||
      !whitelist.includes(req.user.id)
    ) {
      return res
        .status(401)
        .json({ message: "You do not have access to this transcript" });
    }

    return res.status(200).json(transcript._doc);
  });
});

// Post a new transcript
router.post("/", protected, async (req, res) => {
  const requiredFields = ["title"];
  const error = checkFields(requiredFields, req.body);
  if (error) return res.status(400).json({ message: error });

  const transcript = new Transcript({
    title: req.body.title,
    creator: req.user.id,
    recordingLength: req.body.recordingLength ? req.body.recordingLength : 0,
    data: req.body.data ? req.body.data : null,
    isGroup: req.body.isGroup ? req.body.isGroup : false,
    group: req.body.group ? req.body.group : null,
    sharedWith: req.body.sharedWith ? req.body.sharedWith : null
  });
  try {
    const user = await User.findById(req.user.id);

    if (!user) throw new Error("User could not be found!");

    user.transcripts.push(transcript);

    if (transcript.sharedWith && transcript.sharedWith.length > 0) {
      // Add this transcript to all users you've shared it with
      await Promise.all(
        transcript.sharedWith.forEach(async (userId, index) => {
          await User.findById(userId, async (err, doc) => {
            if (err) {
              transcript.sharedWith.splice(index, 1);
              console.error(
                `User with id ${userId} not found. Removing from transcript.`
              );
            } else {
              doc.transcripts.push(transcript);
              await doc.save();
            }
          });
        })
      );
    }

    await user.save();

    await transcript.save();

    return res.status(201).json(user.transcripts);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

// Update a transcript
router.put("/:id", protected, (req, res) => {
  Transcript.findById(req.params.id)
    .then(transcript => {
      if (!transcript._doc.creator === req.user.id)
        return res
          .status(401)
          .json({ message: "You may not modify another user's transcript." });

      const fields = ["title", "data"];

      updateFields(fields, req.body, transcript);

      return transcript.save();
    })
    .then(updatedTranscript => {
      return res.status(200).json(updatedTranscript._doc);
    })
    .catch(err => {
      return res.status(500).json(err.message);
    });
});

// Add member to transcript

// Change member permissions on transcript

// Remove member from transcript

// Delete a transcript
router.delete("/:id", protected, async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript)
      return res
        .status(404)
        .json({ message: "A transcript with that ID does not exist!" });
    if (!transcript._doc.creator.toString() === req.user.id)
      return res
        .status(401)
        .json({ message: "You may not delete another user's transcript" });

    // List of users affected by this deletion
    const targets = transcript._doc.sharedWith;

    // Include the owner of this transcript
    targets.push(req.user.id);

    // Remove reference of this transcript from all users
    await Promise.all(targets.forEach(async userId => {
      const target = await User.findById(userId);
      const newTranscripts = target._doc.transcripts.filter(transcript => {
        return transcript.toString() !== req.params.id;
      });
      target.transcripts = newTranscripts;
      await target.save();
    }))

    // Now we may safely delete the transcript
    await Transcript.deleteOne({ _id: transcript.id });

    return res.status(200).json(user._doc.transcripts);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

module.exports = router;
