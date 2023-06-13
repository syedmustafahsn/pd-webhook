
// Import required modules
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodemailer = require('nodemailer');
const path = require('path');
const Mux = require('@mux/mux-node');
const { default: axios } = require("axios");
const bodyParser = require('body-parser');
const fs = require('fs');
const dotenv = require("dotenv");

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());
app.use(bodyParser.json())
dotenv.config();


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const socketIO = new Server(server, {
    cors: {
        origin: "https://localhost:3000",
        methods: ["GET", "POST"],
    },
});

let onlineUsers = [];

app.post('/webhook', (req, res) => {
    console.log(req.body);
})
// Socket.IO connection handling
socketIO.on('connection', (socket) => {
    console.log('user has joined')
   

    // socket.on('userJoined', (data) => {
    //     // socket.join(data.userId);
    //     console.log(data.roomName + ' has joined his room');
    // })
    
    // socket.on('disconnect', () => {
    //     console.log('🔥: A user disconnected');
    // });
    
    // socket.on('chatChanged', (data) => {
    //     socket.join(data.roomName)
        
    //     console.log(' has joined the chat with ' + data.roomName);
    // })
    
    // // Sends the message to all the users on the server
    // socket.on('message', (data) => {
    //     socketIO.to(data.roomName).emit('messageResponse', data);
    //     console.log(data);
    //     socketIO.emit('messageResponse', data)
    // });

});

// Initialize Mux and Nodemailer
const { Video } = new Mux(
    process.env.MUX_TOKEN_SECRET,
    process.env.MUX_TOKEN_ID
);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: 465,
    auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
    }
});

// Endpoint to create an event
app.post('/create-event', (req, res) => {
    const { attendees, eventName, user, slug } = req.body;

    // Read email template file
    const emailTemplatePath = path.join(__dirname, 'email-template.html');
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');

    // Create a new space
    Video.Spaces.create()
        .then((spaceResponse) => {
            const spaceID = spaceResponse.id;

            // Create a new live stream
            Video.LiveStreams.create({
                playback_policy: 'public',
                new_asset_settings: { playback_policy: 'public' },
            })
                .then((streamResponse) => {
                    const streamID = streamResponse.id;
                    console.log(streamID);

                    // Create a new broadcast
                    Video.Spaces.Broadcasts.create(spaceID, {
                        live_stream_id: streamResponse.id,
                    })
                        .then((broadcastResponse) => {
                            const spaceToken = Mux.JWT.signSpaceId(spaceID);
                            console.log(spaceToken);

                            // Send emails to attendees
                            attendees.forEach(function (to) {
                                const customizedEmailTemplate = emailTemplate
                                    .replace('{user}', user)
                                    .replace('{eventName}', eventName)
                                    .replace('{host}', to.name)
                                    .replace('{token}', process.env.HOME_URL + '/events/' + slug + '/' + to.token)

                                const mailOptions = {
                                    from: process.env.EMAIL_ADDRESS_FROM,
                                    to: to.email,
                                    subject: 'Email Invitation',
                                    html: customizedEmailTemplate
                                };

                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.error('Error sending email:', error);
                                    } else {
                                        console.log('Email sent:', info.response);
                                        res.status(200).json({ success: true });
                                    }
                                });
                            })

                            // Return the space token
                            res.status(200).json({ token: spaceToken, spaceID: spaceID, streamID: streamID });
                        })
                        .catch((error) => {
                            console.error('Failed to create broadcast:', error);
                            console.error(spaceID);
                            res.status(500).json({ error: 'Failed to create broadcast' });
                        });
                })
                .catch((error) => {
                    console.error('Failed to create livestream:', error);
                    res.status(500).json({ error: 'Failed to create livestream' });
                });
        })
        .catch((error) => {
            console.error('Failed to create space:', error);
            res.status(500).json({ error: 'Failed to create space' });
        });
});

// Start the server
server.listen(process.env.PORT || 3001, () => {
    console.log("SERVER IS RUNNING");
    console.log(process.env.EMAIL_SMTP_HOST)
});
