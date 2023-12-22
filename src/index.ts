import * as process from "process";
import * as express from "express";

if (!process.env.CERTIFICATE) {
  throw new Error("Environment Variable CERTIFICATE needs to be set!");
}

const KEY = process.env.KEY;
const CERT = process.env.CERTIFICATE;
const ADD_ROOT_CERT = process.env.ADD_ROOT_CERTIFICATE
  ? process.env.ADD_ROOT_CERTIFICATE.toLowerCase() === "true"
  : true;
const VERIFICATION_METHOD = process.env.VERIFICATION_METHOD;
const PORT = process.env.PORT ?? 3000;

const app = express();
app.set("json spaces", 2);
app.set("trust proxy", true);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send({ hello: "world" });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
