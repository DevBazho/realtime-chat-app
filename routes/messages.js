const router = require("express").Router();
const models = require("../model/Models");
const verify = require("../verifyToken");
const { messageValidaiton } = require("../validation");
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const {format} = require('util');
const dotenv = require('dotenv');
dotenv.config();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - messageStatus
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the messages
 *         toName:
 *           type: string
 *           description: name of the message receiver
 *         msgFrom:
 *           type: string
 *           description: message from (email from user schema)
 *         msgTo:
 *           type: string
 *           description: message to (email from user schema)
 *         message:
 *           type: string
 *           description: chat content
 *         images:
 *           type: string
 *           description: images that can be sent in the chats
 *         messageStatus:
 *           type: Boolean
 *           description: a message status, is it read or not.... false by default
 *         createdAt:
 *           type: Date
 *           description: now by default, date of sent chat
 *       example:
 *         _id: 0820344safAd5fE_asz
 *         toName: John Smith
 *         msgFrom: example@test.com
 *         msgTo: test@example1.com
 *         message: John, what do we have for today? Rose, not sure, let me check...
 *         images: AN IMAGE
 *         messageStatus: read, seen....
 */

 /**
  * @swagger
  * tags:
  *   name: Messages
  *   description: The messages managing API, this is section is to send/receive messages
  */


// GET conversation data
/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Returns the list of all messages
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: The list of all conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 */
router.get("/", verify, async (req, res) => {
  await models.Message.find({}, (err, messages) => {
    res.send(messages);
  });
});


// Get message of a specific user
/**
 * @swagger
 * /messages/by-email:
 *   post:
 *     summary: get all(sent, received) messages of a specific user
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: The list of messages of a specific user
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */
router.post("/by-email", verify, async (req, res) => {
  const emailsSent = await models.Message.find({msgFrom: req.body.msgFrom}).sort({createdAt: -1});
  const emailsReceived = await models.Message.find({msgTo: req.body.msgFrom}).sort({createdAt: -1});
  
    res.send({
      "sentMessages":emailsSent,
      "receivedMessages":emailsReceived
    });
});


// Post Messages
/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Create a new conversation, send chats
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: The message was successfully created
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */

router.post("/send", verify, async (req, res) => {
  const { error } = await messageValidaiton(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  
  // Checking if the sender's email is in the database
  const emailExist = await models.User.findOne({ email: req.body.msgFrom });
  if (!emailExist) return res.status(400).send("this email "+ req.body.msgFrom +" is not REGISTERED!");
  
  // Checking if the receiver's email is in the database
  const emailExist2 = await models.User.findOne({ email: req.body.msgTo });
  if (!emailExist2) return res.status(400).send("this email "+ req.body.msgTo +" is not REGISTERED!");
  
  
  const toName = await models.User.findOne({email: req.body.msgTo});

  const message = await new models.Message({
    toName: toName.name,
    msgFrom: req.body.msgFrom,
    msgTo: req.body.msgTo,
    message: req.body.message
  });

  try {

    await message.save();
    res.send(message)

  } catch (err) {
    res.status(500).send(err.message);
  }

});

// GET user names
/**
 * @swagger
 * /messages/users:
 *   get:
 *     summary: Returns the list of all users names
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: The list of all users name
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 */
 router.get("/users", verify, async (req, res) => {
  let users = await models.User.find({}, 'name');

    res.send(users);
});

/**
 * @swagger
 * /messages/uplaod:
 *   post:
 *     summary: this end point is specialized for uploading chat images
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: The message was successfully created
 *         content:
 *           application/json:
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */
// ****************************************
const gc = new Storage({
  credentials: JSON.parse(process.env.ACCOUNT_KEY),
  projectId: process.env.PROJECT_ID
});

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})
const appBucket = gc.bucket(process.env.BUCKET_NAME);
// *****************************


router.post('/upload', multer.single('image'), verify, async (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  // Create a new blob in the bucket and upload the file data.
  const filename = Date.now()+ '-' +req.file.originalname;
  const blob = appBucket.file(filename);
  const blobStream = blob.createWriteStream();
  
  // /////////////////////
  const { error } = messageValidaiton(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    // Checking if the sender's email is in the database
    const emailExist = await models.User.findOne({ email: req.body.msgFrom });
    if (!emailExist) return res.status(400).send("this email "+ req.body.msgFrom +" is not REGISTERED!");
    
    // Checking if the receiver's email is in the database
    const emailExist2 = await models.User.findOne({ email: req.body.msgTo });
    if (!emailExist2) return res.status(400).send("this email "+ req.body.msgTo +" is not REGISTERED!");
    
    const toName = await models.User.findOne({email: req.body.msgTo});
  
    const message = await new models.Message({
      toName: toName.name,
      msgFrom: req.body.msgFrom,
      msgTo: req.body.msgTo,
      image: filename
    });
  
    try {
      await message.save();
      res.send(message);
      
    } catch (err) {
      res.status(500).send(err.message);
    }
  // ////////////////////////////
  blobStream.on('error', err => {
    next(err);
  });
  
  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      'https://storage.googleapis.com/' + appBucket.name + '/' + blob.name
      );
      
    res.status(200).send();
  });

  blobStream.end(req.file.buffer);
});

/**
 * @swagger
 * /messages/images/{imageName}:
 *   get:
 *     summary: retrieve image by iamge name
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: The message was successfully created
 *         content:
 *           application/json:
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */
router.get('/images/:image', verify, async (req, res) => {  
  const file = appBucket.file(req.params.image);
        return file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491'
        }).then(signedUrls => {
          res.status(200).send(signedUrls);
            // console.log('signed URL', signedUrls[0]); // this will contain the picture's url
    }).catch(err => {
      res.status(400).send(err);
    })
});

module.exports = router;
