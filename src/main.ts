import * as process from "process";
import * as path from "path";
import * as express from "express";
import {
  getDidDocumentHandler as verificationMethodDid,
  getCertificateChainHandler as verificationMethodChain,
} from "@fabianscheidt/did-web-verification-method-server";
import { FileBasedDidStorage } from "./file-based-did-storage";

if (!process.env.KEY) {
  throw new Error("Environment Variable KEY needs to be set!");
}
if (!process.env.CERTIFICATE) {
  throw new Error("Environment Variable CERTIFICATE needs to be set!");
}

const KEY = process.env.KEY;
const CERT = process.env.CERTIFICATE;
const ADD_ROOT_CERT = process.env.ADD_ROOT_CERTIFICATE
  ? process.env.ADD_ROOT_CERTIFICATE.toLowerCase() === "true"
  : true;
const PORT = process.env.PORT ?? 3000;
const STORAGE_PATH =
  process.env.STORAGE_PATH ?? path.join(process.cwd(), "did-documents");

const app = express();
app.set("json spaces", 2);
app.set("trust proxy", true);
app.use(express.json());

// Serve verification Method
app.get("/.well-known/did.json", verificationMethodDid(CERT));
app.get(
  "/.well-known/certificate-chain.pem",
  verificationMethodChain(CERT, ADD_ROOT_CERT),
);

// Serve actual DID solution
const didStorage = new FileBasedDidStorage(KEY, STORAGE_PATH);
app.post("/:didPath/did.json", async (req, res) => {
  if (typeof req.body !== "object" || Array.isArray(req.body)) {
    res.status(400).send({ error: "Invalid request body" });
  }

  try {
    const doc = await didStorage.signAndStoreDidDocument(
      req.body,
      req.hostname,
      req.params["didPath"],
    );
    res.status(201).send(doc);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/:didPath/did.json", async (req, res) => {
  try {
    const doc = await didStorage.retrieveDidDocument(req.params["didPath"]);
    res.status(200).send(doc);
  } catch (e) {
    console.error(e);
    res.status(404).send({ error: "DID document not found" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
