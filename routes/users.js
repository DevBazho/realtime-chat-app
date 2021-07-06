const router = require("express").Router();
const models = require("../model/Models");
const verify = require("../verifyToken");
const bcrypt = require("bcryptjs");
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const {format} = require('util');
const { nameValidaiton, emailValidaiton, passwordValidaiton } = require("../validation");
const dotenv = require('dotenv');
dotenv.config();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the uers
 *         name:
 *           type: string
 *           description: user name, can be a username, nickname, or a full name
 *         email:
 *           type: string
 *           description: user email, must be validm and unique
 *         password:
 *           type: string
 *           description: must be at least 6 characters
 *         bio:
 *           type: string
 *           description: user bio
 *         isActive:
 *           type: Boolean
 *           description: can be used to track users active status, it is false by default
 *         userImage:
 *           type: string
 *           description: stores the image name
 *         regDate:
 *           type: Date
 *           description: user registration date, by default it stores the of registration
 *       example:
 *         name: The employee name
 *         email: The employee email
 *         password: .........
 */

 /**
  * @swagger
  * tags:
  *   name: Users
  *   description: The users managing API, this section is to manage users, create, update, remove users
  */

// GET users
/**
 * @swagger
 * /users/all:
 *   get:
 *     summary: Returns the list of all users --ADMIN PANEL--
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 */
router.get("/all", verify, async (req, res) => {
  let users = await models.User.find({});
  res.send(users);
});


// Delete user
/**
 * @swagger
 * /users/delete/{id}:
 *   delete:
 *     summary: Delete a user by id --ADMIN PANEL--
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: deleted sucessfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad Request
 */
router.delete("/delete/:id", verify, async (req, res) => {
  await models.User.findByIdAndRemove(req.params.id);
  res.status(200).send("deleted successfully");
});
// ****************************


/**
 * @swagger
 * /users/uplaod:
 *   post:
 *     summary: update user Image by user id 
 *     tags: [Users]
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

router.put("/update-image/:id", multer.single('image'), verify, async (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  // Create a new blob in the bucket and upload the file data.
  const filename = Date.now()+ '-' +req.file.originalname;
  const blob = appBucket.file(filename);
  const blobStream = blob.createWriteStream();
  
  // /////////////////////
  try {
    await models.User.findByIdAndUpdate(req.params.id, {
      image: filename
    });
    res.status(200).send(filename);
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


// ****************************
// Edit Users
/**
 * @swagger
 * /users/update-name/{id}:
 *   put:
 *     summary: update a user NAME by id --ADMIN PANEL--
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: deleted sucessfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The user wasn't found
 *       500:
 *         description: Some error happened
 */
router.put("/update-name/:id", verify, async (req, res) => {
  const { error } = nameValidaiton(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  
  try {
    await models.User.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
    });
    res.status(200).send(req.body.name + " updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// Edit Users
/**
 * @swagger
 * /users/update-password/{id}:
 *   put:
 *     summary: update a user PASSWORD by id --ADMIN PANEL--
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: deleted sucessfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The user wasn't found
 *       500:
 *         description: Some error happened
 */
router.put("/update-password/:id", verify, async (req, res) => {
  const { error } = passwordValidaiton(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  
  try {
    await models.User.findByIdAndUpdate(req.params.id, {
      password: hashPassword,
    });
    res.status(200).send("User PASSWORD updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// edit email
/**
 * @swagger
 * /users/update-email/{id}:
 *   put:
 *     summary: update a user EMAIL by id --ADMIN PANEL--
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: deleted sucessfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The user wasn't found
 *       500:
 *         description: Some error happened
 */
router.put("/update-email/:id", verify, async (req, res) => {
  const { error } = emailValidaiton(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  
  // Checking if the user is already in the database
  const emailExist = await models.User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email already exists");

  // const email = await models.User.findOne({ msgFrom: emailExist });
  
  
  try {
    const email = await models.User.findById(req.params.id);
    // change email of msgFrom in the message Schema
    await models.Message.findOneAndUpdate(
      {msgFrom: email.email}, {msgFrom: req.body.email},{new: true}, (err, data) => {
        if (err) {
          console.log(err);
        }else{
          console.log(data);
        }
      }
    );

    // change email of msgTo in the message Schema
    await models.Message.findOneAndUpdate(
      {msgTo: email.email}, {msgTo: req.body.email},{new: true}, (err, data) => {
        if (err) {
          console.log(err);
        }else{
          console.log(data);
        }
      }
    );

    // update the user email
    await models.User.findByIdAndUpdate(req.params.id, {
      email: req.body.email,
    });

    res.status(200).send(req.body.email + " updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * @swagger
 * /users/images/{imageName}:
 *   get:
 *     summary: retrieve image by iamge name
 *     tags: [Users]
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
