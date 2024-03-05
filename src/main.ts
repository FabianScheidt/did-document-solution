import * as process from "process";
import * as path from "path";
import * as express from "express";
import {
  getDidDocumentHandler as verificationMethodDid,
  getCertificateChainHandler as verificationMethodChain,
  getDidDocument,
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
const DEFAULT_SIGNATURE_FLAVOUR =
  process.env.DEFAULT_SIGNATURE_FLAVOUR ?? "Gaia-X";

const app = express();
app.set("json spaces", 2);
app.set("trust proxy", true);
app.use(express.json());

// Serve verification Method
const verificationMethodPath = "/.well-known/did.json";
app.get(verificationMethodPath, verificationMethodDid(CERT));
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

  const flavour =
    req.headers["x-signature-flavour"] ?? DEFAULT_SIGNATURE_FLAVOUR;
  if (typeof flavour !== "string") {
    res.status(400).send({
      message: "Received more than one value for X-Signature-Flavour",
    });
    return;
  }
  if (flavour !== "Specification" && flavour !== "Gaia-X") {
    res
      .status(400)
      .send({ message: "Received invalid value for X-Signature-Flavour" });
    return;
  }

  try {
    const verificationMethodDid = await getDidDocument(CERT, {
      protocol: req.protocol,
      hostname: req.hostname,
      path: verificationMethodPath,
    });
    const doc = await didStorage.signAndStoreDidDocument(
      req.body,
      req.hostname,
      req.params["didPath"],
      verificationMethodDid.id,
      verificationMethodDid.verificationMethod[0].id,
      { flavour },
    );
    res.status(201).send(doc);
  } catch (e) {
    console.error(e);
    const message =
      e && typeof e === "object" && "message" in e ? e.message : "";
    const error = `Internal Server Error${message ? ": " + message : ""}`;
    res.status(500).send({ error });
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
