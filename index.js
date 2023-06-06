const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser"); // Require body-parser

app.use(cors());
app.use(bodyParser.json()); // Use body-parser middleware

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
    });

    app.post("/webhook", (req, res) => {
        console.log(req.body); // Access the request body
        socket.emit('response');
        res.status(200).end();
    });
});

server.listen(process.env.PORT || 3001, () => {
    console.log("SERVER IS RUNNING");
});
