const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors');


const port = process.env.PORT || 3000;


// Extended: https://swagger.io/specification/#infoObject
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
        version: '1.0.0',
        title: 'Realtime Chat App API',
        description: 'Realtime Chat App API Documentation',
        contact: {
            name: 'Dev-Bazh0'
        },
        servers: [{
            url: 'https://devbazh0-realtime-chat-app.herokuapp.com'
        }]
        }
    },
    apis: ['./routes/*.js']
    };
    
    const specs = swaggerJsDoc(options);
    
    const app = express();
    
    app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));



// IMPORT ROUTES
const authRoute = require('./routes/auth');
const messages = require('./routes/messages');
const users = require('./routes/users');
const rooms = require('./routes/rooms');

dotenv.config();


// CONNECT to DB
mongoose.connect(
  process.env.DB_CONNECT,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  () => console.log('Connected to DB')
);

// MIDDLEWARES
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next();
});

// Route MIDDLEWARES
app.use('/api/user', authRoute);
app.use('/messages', messages);
app.use('/users', users);
app.use('/rooms', rooms);
app.use('/uploads', express.static('./uploads'));

app.listen(port, () => console.log('SERVER up and Running on PORT ' + port));
