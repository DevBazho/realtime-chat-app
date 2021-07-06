const router = require('express').Router();
const models = require('../model/Models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const  {registerValidation, loginValidation} = require('../validation');



// Register a User
/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a User
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: user already exist || bad request
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized || Access denied
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */

router.post('/register', async (req, res) => {
    let rb = req.body;

    // Let's validate the data before we make a user
    const {error} = registerValidation(rb);
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if the user is already in the database
    const emailExist = await models.User.findOne({email: rb.email});
    if (emailExist) return res.status(400).send('Email already exists');


    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(rb.password, salt);
    
    const user = new models.User({
        name: rb.name,
        email: rb.email,
        password: hashPassword,
    });
    try {
        const savedUser = await user.save();
        res.send({user: user._id});
    } catch (err) {
        res.status(400).send(err);
    }
});

// LOGIN
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: user info a long with a token
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: user already exist || bad request
 *         content:
 *           application/json:
 *       401:
 *         description: Unauthorized || Access denied
 *         content:
 *           application/json:
 *       500:
 *         description: Some server error
 */
router.post('/login', async (req, res) => {
    let rb = req.body;
    const users = await models.User.findOne({email: rb.email});

    const {error} = loginValidation(rb);
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if the email exists
    const user = await models.User.findOne({email: rb.email});
    if (!user) return res.status(400).send('Email or password is wrong!');

    // check if the password is CORRECT
    const validPass = await bcrypt.compare(rb.password, user.password);
    if(!validPass) return res.status(400).send('Email or password is wrong!!');


    // Create and asign a token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send({token: token, user: users});
    

});



module.exports = router;