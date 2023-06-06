const express = require("express");
const bodyParser = require("body-parser")
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

app.use(bodyParser.json())


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://podzsurface-test.vercel.app/",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data);
        console.log('send')
    });

    app.post("/webhook", (req, res) => {
        console.log(req.body)

        socket.emit('response', req.body)

        res.status(200).end()
    })
});



server.listen(process.env.PORT || 3001, () => {
    console.log("SERVER IS RUNNING");
});
