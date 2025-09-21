import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.io setup
// export const io = new Server(server, {
//   cors: { origin: "http://localhost:5173" },
// });

// Store online users
export const userSocketMap = {};

// Middleware setup
app.use(express.json({ limit: "4mb" }));
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "token"],
//     credentials: true,
//   })
// );

export const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "token"],
    credentials: true,
  })
);

// Socket.io connection
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// Routes setup
app.use("/api/status", (req, res) => {
  res.send("Server is live");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect DB
await connectDB();

// 
// ✅ Always start server locally
// server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// if (
//   // process.env.DEPLOYMENT_PLATFORM === "railway" ||
//   process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// }

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Export server for Vercel (optional)
export default server;
