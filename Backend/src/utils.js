import * as url from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const PRIVATE_KEY = "VideoGameShop_SerialKey_Jwt";

export const __filename = url.fileURLToPath(import.meta.url);

export const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const createHash = (password) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) =>
  bcrypt.compareSync(password, user.password);

export const generateToken = (user, duration) =>
  jwt.sign(user, PRIVATE_KEY, { expiresIn: duration });

export const authToken = (req, res, next) => {
  const headerToken = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : undefined;
  const cookieToken =
    req.cookies && req.cookies["accessToken"]
      ? req.cookies["accessToken"]
      : undefined;
  const queryToken = req.query.access_token
    ? req.query.access_token
    : undefined;
  const receivedToken = headerToken || cookieToken || queryToken;

  if (!receivedToken) return res.redirect("/login");

  jwt.verify(receivedToken, PRIVATE_KEY, (err, credentials) => {
    if (err)
      return res.status(403).send({ status: "ERR", data: "Unauthorized" });
    // Si el token verifica ok, pasamos los datos del payload a un objeto req.user
    req.user = credentials;
    next();
  });
};

export const handlePolicies = (policies) => {
  return async (req, res, next) => {
    if (!req.session.user)
      return res
        .status(401)
        .send({ status: "ERROR", data: "User not athorized" });

    const userRole = req.session.user.role.toUpperCase();

    policies.forEach(
      (policy, index) => (policies[index] = policies[index].toUpperCase())
    );

    if (policies.includes("PUBLIC")) return next();
    if (policies.includes(userRole)) return next();
    res.status(403).send({ status: "ERR", data: "Not enough permisions" });
  };
};

// Roles:
/*
 * PUBLIC
 * AUTH / AUTHENTICATED
 * USER / REGUAR
 * USER_PREMIUM / PREMIUM
 * ADMIN
 */
