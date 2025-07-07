const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

const wss = new WebSocket.Server({ noServer: true });

// Only accept WebSocket upgrade requests on the SAME path `/`
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy(); // reject upgrades on unknown paths
  }
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("client connected");
  const numClients = wss.clients.size;
  wss.broadcast(`Current visitors: ${numClients}`);

  ws.send("welcome to my server");

  db.run(`INSERT INTO visitors (count, time)
  VALUES (${numClients}, datetime('now'))
`);

  ws.on("close", () => {
    const newNumClients = wss.clients.size;
    wss.broadcast(`Current visitors: ${newNumClients}`);
    console.log("client disconnected");
  });
});

// Broadcast helper
wss.broadcast = function broadcast(data) {
  this.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

// Start server
server.listen(3000, () => console.log("Server running on port 3000"));

process.on("SIGINT", () => {
  console.log("sigint");
  wss.clients.forEach(function each(client) {
    client.close();
  });
  server.close(() => {
    shutdownDB();
  });
});

// Database

const sqlite = require("sqlite3");
const db = new sqlite.Database(":memory:");

db.serialize(() => {
  db.run(`
CREATE TABLE visitors (
count INTEGER,
time TEXT
)
`);
});

function getCounts() {
  db.each("SELECT * FROM visitors", (err, row) => {
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log("Shutting down db");
  db.close();
}
