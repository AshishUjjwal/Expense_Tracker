import express from "express";
import http from "http";
import cors from "cors";
import dotenv, { configDotenv } from "dotenv";
import path from "path";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";
import { buildContext } from "graphql-passport";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import { connectDB } from "./db/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";

dotenv.config();
configDotenv();
configurePassport();

const __dirname = path.resolve();

const app = express();

// Set up CORS to allow requests from your frontend's origin
const corsOptions = {
  origin: 'http://127.0.0.1:3000', // Allow the frontend address
  credentials: true, // Allow cookies to be sent with requests
};

app.use(cors(corsOptions)); // Apply CORS middleware

const httpServer = http.createServer(app);

const MongoStore = connectMongo(session);

const store = new MongoStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});


store.on("error", (err) => console.log("Session store error:",err));

try {
  app.use(
    session({
      secret: process.env.SESSION_SECRET||'your-default-secret',
      resave: false, //this is set to false because we don't want to save the session if it's not modified
      saveUninitialized: false, //this is set to false because we don't want to save an uninitialized session to the store
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true, // this is set to true because we don't want javascript to access this cookie
        secure: false,
      },
      store: store,
    })
  );
} catch (error) {
  console.error("Session configuration error:", error);
}


app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/graphql",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
  express.json(),

  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res }),
  })
);

// npm run build will build this frontend app, and it will the optimized version of this app
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

connectDB()
    .then(() => {
        app.listen(() => {
            console.log(`🚀 Server ready at http://localhost:4000/graphql`);
        })
    })
    .catch((err) => {
        console.log('Error connecting to the database', err);
        process.exit(1);  // Exit the process with an error code of 1
    })
// console.log(`🚀 Server ready at http://localhost:4000/graphql`);
