require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const auth = require('./auth');
const transcripts = require('./transcripts');

const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(auth);
app.use('/transcripts', transcripts);

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if(err) throw err;
  else app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}...`)
  })
});