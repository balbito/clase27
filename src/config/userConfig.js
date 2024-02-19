import passport from "passport";
import passportLocal from "passport-local";
import GitHubStrategy from "passport-github2";
import jwtStrategy from "passport-jwt";
import userModel from "../dao/models/user.model.js";
import { createHash } from "../utils/bcrypt.js";
import config from "./config.js";

const privateKey = config.privateKey;

//Local Strategy
const localStrategy = passportLocal.Strategy;

const JwtStrategy = jwtStrategy.Strategy;
const ExtractJWT = jwtStrategy.ExtractJwt;

const initializePassport = () => {
  //JWTStrategy with Cookie
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: privateKey,
      },
      async (jwt_payload, done) => {
        console.log("Entreing passport Strategy with JWT");
        try {
          console.log("JWT obtained from Payload");
          console.log(jwt_payload);
          return done(null, jwt_payload.user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  //Github Register/Login
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackUrl: config.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("Profile obtained from GitHub user: ");
        console.log(profile);
        try {
          //User existance in DB validation
          const user = await userModel.findOne({ email: profile._json.email });
          console.log("User found for login:");
          console.log(user);
          if (!user) {
            console.warn(
              "User doesn't exists with email: " + profile._json.email
            );
            let newUser = {
              first_name: profile._json.name,
              last_name: "",
              age: 18,
              email: profile._json.email,
              password: "",
              loggedBy: "GitHub",
              role: "user",
            };
            const result = await userModel.create(newUser);
            return done(null, result);
          } else {
            //If the user exists in DB
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  //Passport Local
  //Register
  passport.use(
    "register",
    new localStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;
        try {
          //User in DB validation
          const user = await userModel.findOne({ email });
          if (user) {
            console.log("User registered with provided email");
            done(null, false);
          }
          //Admin role validation
          let role;
          if (email === "adminCoder@coder.com") {
            role = "admin";
          }
          const newUser = {
            first_name,
            last_name,
            email,
            age,
            password: createHash(password),
            loggedBy: "App",
            role,
          };
          const result = await userModel.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("Error registering user: " + error);
        }
      }
    )
  );

  //Serialize function
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  //Deserialize function
  passport.deserializeUser(async (id, done) => {
    try {
      let user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user: " + error);
    }
  });
};

//CookieExtractor function
const cookieExtractor = (req) => {
  let token = null;
  console.log("Entering Cookie Extractor");
  if (req && req.cookies) {
    //Request and cookies validation
    console.log("Present Cookies: ");
    console.log(req.cookies);
    token = req.cookies["jwtCookieToken"];
    console.log("Token obteined from Cookie:");
    console.log(token);
  }
  return token;
};

export default initializePassport;