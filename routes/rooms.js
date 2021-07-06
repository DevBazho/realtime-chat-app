const router = require("express").Router();
const models = require("../model/Models");
const verify = require("../verifyToken");
// const { messageValidaiton } = require("../validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the rooms
 *         name:
 *           type: string
 *           description: name of the room
 *         topic:
 *           type: string
 *           description: room topic
 *         userOne:
 *           type: string
 *           description: user number one in a room
 *         userTwo:
 *           type: string
 *           description: user number two in a room
 *         users:
 *           type: array
 *           description: can store users of certain rooms
 *         messages:
 *           type: array
 *           description: can store the messages of certain rooms
 *         createdAt:
 *           type: Date
 *           description: the creation date of the room
 *         updatedAt:
 *           type: Date
 *           description: now by default, date of sent chat
 *       example:
 *         _id: 0820344safAd5fE_asz
 *         name: room1
 *         topic: second project
 *         userOne: test@example1.com
 *         userTwo: test2@example1.com
 *         createdAt: 26/5/2021
 */

 /**
  * @swagger
  * tags:
  *   name: Rooms
  *   description: The rooms managing API
  */


// GET room data
/**
 * @swagger
 * /rooms/all:
 *   get:
 *     summary: Returns the list of all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: The list of all rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 */
router.get("/all", async (req, res) => {
  await models.Room.find({}, (err, rooms) => {
    res.send(rooms);
  });
});


// Create Room
/**
 * @swagger
 * /rooms/create-room:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
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
router.post("/create-room", async (req, res) => {
  // const { error } = messageValidaiton(req.body);
  // if (error) return res.status(400).send(error.details[0].message);

  const room = await new models.Room({
    name: req.body.name,
    topic: req.body.topic,
    createdAt: new Date().now,
  });

  try {
    await room.save();
    res.send(room);
  } catch (err) {
    res.status(500).send(err.room);
  }

});

module.exports = router;
