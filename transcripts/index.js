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

    let response = await Promise.all(
      user._doc.transcripts.map(transcript => Transcript.findById(transcript))
    );

    response = response.filter(transcript => !transcript || !transcript.parent)

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

// Get a transcript by id
router.get("/:id", protected, async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript)
      return res
        .status(404)
        .json({ message: "A transcript with that ID does not exist!" });

    // Users with access to this transcript
    const whitelist = [];

    let target = transcript;

    while (target && target._doc) {
      console.log(target._doc);
      whitelist.push(target._doc.creator.toString());
      target.sharedWith.forEach(userId => {
        whitelist.push(userId.user.toString());
      });
      target = target.parent;
    }

    if (!whitelist.includes(req.user.id)) {
      return res
        .status(401)
        .json({ message: "You do not have access to this transcript" });
    }

    // Check if this transcript is a group and return
    // an array of child transcripts if it is
    if (transcript._doc.isGroup) {
      const children = await Transcript.find({parent: req.params.id});
      transcript._doc.children = children;
    }

    return res.status(200).json(transcript._doc);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
});

// Post a new transcript
router.post("/", protected, async (req, res) => {
  try {
    const requiredFields = ["title"];

    // If this isn't a container/group of transcripts, require the following
    if (!req.body.isGroup) requiredFields.push("data", "recordingLength");

    const error = checkFields(requiredFields, req.body);
    if (error) throw new Error(error);

    // A parsed list of invited users
    let sharedWith = [];

    // Make sure the provided sharedWith array contains valid data
    if (req.body.sharedWith && req.body.sharedWith.length > 0) {
      req.body.sharedWith.forEach(user => {
        if (checkFields(["userId", "edit"], user))
          throw new Error(
            "Bad input: sharedWith should be an array of objects, each with valid fields `userId`(String) and `edit`(bool)"
          );
        else {
          // Make sure not to add the owner into the shared list
          if (user.userId !== req.user.id)
            sharedWith.push({ user: user.userId, edit: user.edit });
        }
      });
    } else sharedWith = [];

    const transcript = new Transcript({
      title: req.body.title,
      creator: req.user.id,
      recordingLength: req.body.recordingLength ? req.body.recordingLength : 0,
      data: req.body.data ? req.body.data : null,
      isGroup: req.body.isGroup ? req.body.isGroup : false,
      group: req.body.group ? req.body.group : null,
      sharedWith,
      parent: req.body.parent ? req.body.parent : null
    });

    let user = await User.findById(req.user.id);

    if (!user) throw new Error("User could not be found!");

    if(transcript === null)
      throw new Error('Bad request - Resulted in null transcript')

    user.transcripts.push(transcript);

    if (transcript.sharedWith && transcript.sharedWith.length > 0) {
      // Add this transcript to all users you've shared it with
      await Promise.all(
        transcript.sharedWith.map(async (userId, index) => {
          await User.findById(userId.user, async (err, doc) => {
            if (err || !doc) {
              transcript.sharedWith.splice(index, 1);
              console.error(
                `User with id ${userId.user} not found. Removing from transcript.`
              );
            } else {
              doc.transcripts.push(transcript);
              await doc.save();
            }
          });
        })
      );
    }

    user = await user.save();

    await transcript.save();

    return res.status(201).json(user.transcripts);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err.message);
  }
});

// Update a transcript
router.put("/:id", protected, (req, res) => {
  Transcript.findById(req.params.id)
    .then(transcript => {
      const isOwner = transcript._doc.creator.toString() === req.user.id;

      const invite = transcript._doc.sharedWith.find(
        inv => inv.userId.toString() === req.user.id
      );

      const isAuthorized = invite && invite.edit;

      if (!isOwner && !isAuthorized)
        return res
          .status(401)
          .json({ message: "You may not modify this transcript." });

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

// Add member(s) to transcript
router.post("/share/:id", protected, async (req, res) => {
  // Check that req.body.users exists
  try {
    if (checkFields(["users"], req.body))
      throw new Error(
        "Please provide a users array of objects, each with fields `userId`(String) and `edit`(bool)"
      );

    // Each user element should be an object:
    /*
    {
      userId: 5e01h5.92mdmdfsae10nda15f,
      edit: false
    }
  */
    req.body.users.forEach(user => {
      if (checkFields(["userId", "edit"], user))
        throw new Error(
          "Bad input: Please provide a users array of objects, each with fields `userId`(String) and `edit`(bool)"
        );
    });

    // Add user into transcript `sharedWith` list
    // and check for duplicates beforehand
    let transcript = await Transcript.findById(req.params.id);

    if (!transcript)
      throw new Error("A transcript with that ID could not be found.");

    // Make sure this is the owner making this request
    if (!transcript._doc.creator.toString() === req.user.id)
      return res.status(401).json({
        message: "You may not add members to another user's transcript."
      });

    const preexisting = transcript._doc.sharedWith.map(share =>
      share.user.toString()
    );

    // List of users verified to exist
    const users = [];

    await Promise.all(
      req.body.users.map(async user => {
        const doc = await User.findById(user.userId);
        if (
          doc &&
          !preexisting.includes(user.userId) &&
          user.userId !== req.user.id
        ) {
          users.push(doc);
          transcript.sharedWith.push({
            user: user.userId,
            edit: user.edit
          });
        }
      })
    );

    transcript = await transcript.save();

    // Add transcript id into all users listed that exist
    // and check for duplicates beforehand
    await Promise.all(
      users.map(async user => {
        if (!user._doc.transcripts.includes(transcript.id)) {
          console.log("adding transcript to user...");
          user.transcripts.push(transcript);
          await user.save();
        }
      })
    );

    // Return new transcript doc
    return res.status(200).json(transcript);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Change member permissions on transcript
router.put("/share/:id", protected, async (req, res) => {
  // Check that req.body.userId and req.body.edit exist
  // req.body should look like this:
  /*
    {
      userId: 5e01h5.92mdmdfsae10nda15f,
      edit: false
    }
  */
  try {
    const error = checkFields(["userId", "edit"], req.body);

    if (error) throw new Error(error);

    if (typeof req.body.edit !== "boolean")
      throw new Error("Bad input: `edit` field must be a boolean");

    // Look for user with that id in the transcript,

    let transcript = await Transcript.findById(req.params.id);

    if (!transcript)
      throw new Error("A transcript with that ID could not be found!");

    // Make sure the owner is doing this
    if (transcript._doc.creator.toString() !== req.user.id)
      throw new Error(
        "You are unauthorized to change permissions on this transcript."
      );

    // then update their permission accordingly

    const index = transcript.sharedWith.findIndex(
      user => user.user.toString() === req.body.userId
    );

    if (index === -1)
      throw new Error("The specified user is not a member on this transcript!");

    transcript.sharedWith[index].edit = req.body.edit;

    transcript = await transcript.save();

    // Return new transcript doc
    return res.status(200).json(transcript);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Remove member from transcript
router.delete("/share/:id", protected, async (req, res) => {
  try {
    // Check that req.body.userId exists
    const error = checkFields(["userId"], req.body);
    if (error) throw new Error(error);

    // Make sure the transcript exists
    let transcript = await Transcript.findById(req.params.id);

    if (!transcript)
      throw new Error("A transcript with that ID does not exist");

    // Make sure the owner is doing this
    if (transcript._doc.creator.toString() !== req.user.id)
      throw new Error(
        "You are not authorized to remove members from this transcript"
      );

    // Remove the transcript from that user's doc
    const user = await User.findById(req.body.userId);

    if (!user) throw new Error("A user with that ID could not be found!");

    user.transcripts = user.transcripts.filter(
      trans => trans.toString() !== req.params.id
    );

    await user.save();

    // Then remove user from the transcript doc
    transcript.sharedWith = transcript.sharedWith.filter(
      usr => usr.user.toString() !== req.body.userId
    );

    transcript = await transcript.save();

    // Return new transcript doc
    return res.status(200).json(transcript);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

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
    await Promise.all(
      targets.map(async userId => {
        const target = await User.findById(userId);
        const newTranscripts = target._doc.transcripts.filter(transcript => {
          return transcript.toString() !== req.params.id;
        });
        target.transcripts = newTranscripts;
        await target.save();
      })
    );

    // Now we may safely delete the transcript
    await Transcript.deleteOne({ _id: transcript.id });

    return res.send(200);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err.message);
  }
});

module.exports = router;
