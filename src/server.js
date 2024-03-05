// Modules imports:
import express from 'express';
import handlebars from  'express-handlebars';
import Handlebars from 'handlebars';

// Passport imports:
import passport from "passport";
import cookieParser from 'cookie-parser';
import initializePassport from "./config/userConfig.js";

// Router imports:
import { ProductRouter } from './routes/api/products.router.js';
import { CartsRouter } from './routes/api/carts.router.js';
import { viewsRouter } from './routes/views/views.router.js';
import { adminRouter } from './routes/views/admin.views.routes.js';
import ticketRouter from './routes/api/tickets.router.js';
import emailRouter from './routes/api/email.router.js';
import usersRouter from './routes/api/users.router.js';
import userViewRouter from './routes/views/users.views.router.js';
import jwtRouter from './routes/api/jwt.router.js';
import githubLoginViewsRouter from './routes/views/github-login.views.routes.js';
import actionRouter from './routes/api/users.actions.routes.js';

// Assets imports:
import { Server } from 'socket.io';
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import basePath from './utils/utils.js';
import { messagesService } from './services/service.js';

// Config imports:
import config from './config/config.js';
import MongoSingleton from "./config/mongodb_Singleton.js";
import cors from 'cors';

// SERVER
const app = express();
const PORT = config.port;
const httpServer = app.listen(PORT, () => {
  `Server listening on port ${PORT}`;
});

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
initializePassport();
app.use(passport.initialize());
app.use(cors());

//Handlebars
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      ifRoleEquals: function (role, targetRole, options) {
        return role === targetRole ? options.fn(this) : options.inverse(this);
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", `${basePath}/views`);

//Static
app.use(express.static(`${basePath}/public`));

// MONGOOSE
const mongoInstance = async () => {
  try {
    await MongoSingleton.getInstance();
  } catch (error) {
    console.log(error);
  }
};
mongoInstance();

// SOCKET
const io = new Server(httpServer);

//Cookies
app.use(cookieParser("CoderS3cr3tC0d3"));

// ROUTES
app.use("/api/products", ProductRouter);
app.use("/api/carts", CartsRouter);
app.use("/api/users", usersRouter);
app.use("/api/jwt", jwtRouter);
app.use("/api/actions", actionRouter);
app.use("/api/email", emailRouter);
app.use("/api/tickets", ticketRouter);



// VIEWROUTER
app.use("/", viewsRouter);
app.use("/users", userViewRouter);
app.use("/github", githubLoginViewsRouter);
app.use("/admin", adminRouter);


io.on("connection", (socket) => {
  console.log("client connected" + socket.id);

  socket.on("message", async (data) => {
    // servidor recibe el mensaje
    console.log(data);
    await messagesService.createMessage(data)
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected" + socket.id);
  })

});