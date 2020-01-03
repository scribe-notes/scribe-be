const express = require("express");
const protected = require("../auth/protected");
const checkFields = require("../util/checkFields");
const updateFields = require("../util/updateFields");

const Transcript = require("../models/Transcript");
const User = require("../models/User");

const router = express.Router();

// Get all scripts belonging to token bearer
router.get("/mine", protected, async (req, res) => {

  try  {
  const user = await User.findById(req.user.id);

  if(!user) return res.status(404).json({ message: "Unable to find user!" });

  const response = [];

  await user._doc.transcripts.forEach(async (transcript, index) => {
    const data = await Transcript.findById(transcript);
    response.push(data);
    if(index === user._doc.transcripts.length -1)
      return res.status(200).json(response);
  })
} catch (err) {
  return res.status(500).json(err.message);
}

  // User.findById(req.user.id)
  //   .then(user => {
  //     if (!user)
  //       return res.status(404).json({ message: "Unable to find user!" });

  //     const response = user._doc.transcripts.map(transcript => {
  //       Transcript.findById(transcript).then(res => res);
  //     })

  //     return res.status(200).json(response);
  //   })
  //   .catch(err => {
      
  //   });
});

// Get a transcript by id
router.get("/:id", protected, (req, res) => {
  Transcript.findById(req.params.id).then(transcript => {
    if (!transcript)
      return res
        .status(404)
        .json({ message: "A transcript with that ID does not exist!" });
    if (transcript._doc.creator.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "You may not read another user's transcript." });
    }

    return res.status(200).json(transcript._doc);
  });
});

// Post a new transcript
router.post("/", protected, (req, res) => {
  const requiredFields = ["title", "recordingLength", "data"];
  const error = checkFields(requiredFields, req.body);
  if (error) return res.status(400).json({ message: error });

  const transcript = new Transcript({
    title: req.body.title,
    creator: req.user.id,
    recordingLength: req.body.recordingLength,
    data: req.body.data
  });

  console.log(req.user);

  User.findById(req.user.id)
    .then(user => {
      if (!user) throw new Error("User could not be found!");

      user.transcripts.push(transcript);
      return user.save();
    })
    .then(user => {
      transcript.save();
      return res.status(201).json(user.transcripts);
    })
    .catch(err => {
      return res.status(500).json(err.message);
    });
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

// Delete a transcript
router.delete("/:id", protected, (req, res) => {
  Transcript.findById(req.params.id)
    .then(transcript => {
      if(!transcript) return res.status(404).json({message: "A transcript with that ID does not exist!"});
      if (!transcript._doc.creator === req.user.id)
        return res
          .status(401)
          .json({ message: "You may not delete another user's transcript" });

      return Transcript.deleteOne({ _id: transcript.id });
      
    }).then(() => {
      return User.findById(req.user.id);
    }).then(user => {
      const newTranscripts = user._doc.transcripts.filter(transcript => {
        return transcript.toString() !== req.params.id;
      });
      console.log(newTranscripts);
      user.transcripts = newTranscripts;
      return user.save();
    })
    .then(user => {
      return res.status(200).json(user._doc.transcripts);
    })
    .catch(err => {
      return res.status(500).json(err.message);
    });
});

module.exports = router;
