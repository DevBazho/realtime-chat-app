const { string, object } = require("@hapi/joi");
const mongoose = require("mongoose");


// USER Schema
const user = new mongoose.Schema({
  name: {
    type: String,
    min: 6,
    max: 100,
    required: true
  },
  email: {
    type: String,
    min: 6,
    max: 100,
    lowercase: true,
    required: true
  },
  password: {
    type: String,
    min: 6,
    max: 1024,
    required: true
  },
  bio: {
    type: String,
    max: 255
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: '1.png'
  },
  gender: {
    type: String,
    min: 3,
    max: 25,
  },
  birthday: {
    type: Date,
  },
  regDate: {
    type: Date,
    default: Date.now,
  },
});

//Room Schema 
const room = new mongoose.Schema({
  name: { 
    type: String,
    max: 50,
    lowercase: true, 
    unique: true,
    required: true
  },
  topic: String,
  userOne: '',
  userTwo: '',
  users: [],
  messages: [],
  createdAt: Date,
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Message Schema
const message = new mongoose.Schema({
  toName: {
    type: String,
    max: 50
  },
  msgFrom: {
    type: String,
    min: 6,
    max: 100,
    lowercase: true,
    required: true
  },
  msgTo: {
    type: String,
    min: 6,
    max: 100,
    lowercase: true,
    required: true
  },
  message: {
    type: String,
    max: 1024,
  },
  image: {
    type: String
  },
  messageStatus: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const User = mongoose.model("User", user);
const Room = mongoose.model("Room", room);
const Message = mongoose.model("Message", message);

module.exports = {
  User: User,
  Room: Room,
  Message: Message,
};
