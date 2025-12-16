const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let queue = [];

const updateQueueStatus = () => {
  queue.forEach((socketId, index) => {
    io.to(socketId).emit('queue_status', { 
      myPosition: index, 
      totalUsers: queue.length 
    });
  });
};

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);
  
  if (!queue.includes(socket.id)) {
    queue.push(socket.id);
  }
  
  updateQueueStatus();

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    queue = queue.filter(id => id !== socket.id);
    updateQueueStatus();
  });

  socket.on('command', (cmd) => {
    if (queue.length > 0 && queue[0] === socket.id) {
        console.log(`📢 Command AUTHORIZED from ${socket.id}: ${cmd}`);
        // io.emit('esp32_command', cmd); 
    } else {
        console.log(`⛔ Command DENIED from ${socket.id}`);
    }
  });
});

setInterval(() => {
  const simulatedValue = Math.floor(Math.random() * 200) + 600; 
  io.emit('sensor_data', simulatedValue);
}, 1000);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});