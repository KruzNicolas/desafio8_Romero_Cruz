import express from "express";
import { Server } from "socket.io";
import handlebars from "express-handlebars";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import cors from "cors";

import productsRouter from "./routes/products.routes.js";
import cartsRouter from "./routes/carts.routes.js";
import chatModel from "../src/models/message.models.js";
import chatRouter from "./routes/chat.routes.js";
import sessionRouter from "./routes/session.routes.js";
import viewsRouter from "./routes/views.routes.js";
import mocksRouter from "./mocks/productsMocks.js";
import MongoSingleton from "./services/mongo.singleton.js";

import config from "./config.js";
import { __dirname, __filename } from "./utils.js";

try {
  // Mongo Atlas Connect
  await MongoSingleton.getInstance();

  // Express config
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: "*",
      methods: "GET, POST, PUT, DELETE",
    })
  );

  // Session
  app.use(
    session({
      store: MongoStore.create({
        mongoUrl: config.MONGOOSE_URL,
        mongoOptions: {},
        ttl: 1800,
      }),
      secret: config.MONGOOSE_STORE_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

  // Cookie
  app.use(cookieParser(config.SIGNEDCOOKIECODE));

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Endpoints
  app.use("/api/products", productsRouter);
  app.use("/api/carts", cartsRouter);
  app.use("/api/sessions", sessionRouter);
  app.use("/mock", mocksRouter);

  // Chat Endpoint
  app.use("/", chatRouter);

  // Views Endpoint
  app.use("/", viewsRouter);

  app.engine("handlebars", handlebars.engine());
  app.set("views", `${__dirname}/views`);
  app.set("view engine", "handlebars");

  app.use("/static", express.static(`${__dirname}/public`));

  const httpServer = app.listen(config.PORT, () => {
    console.log(`Express server active on port ${config.PORT}`);
  });

  app.use((err, req, res, next) => {
    const code = err.code || 500;
    const message = err.message || "Internal error";
    return res.status(code).send({ status: "ERR", data: message });
  });

  // WebSocket things
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
      credentials: false,
    },
  });

  app.set("io", io);

  io.on("connection", async (socket) => {
    socket.on("user_connected", async (data) => {
      const chat_message = await chatModel.find();
      socket.broadcast.emit("user_connected", data);
      io.emit("chatLogs", chat_message);
      console.log(`Chat actual enviado a ${socket.id}`);
    });

    socket.on("message", async (data) => {
      const pushChat = await chatModel.create(data);

      io.emit("messageLogs", pushChat);
    });
  });
} catch (err) {
  console.log(`Error initializing server (${err.message})`);
}
