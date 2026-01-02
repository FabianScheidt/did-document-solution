import { describe, test } from "node:test";
import * as assert from "node:assert";
import * as supertest from "supertest";
import { app } from "./server";

describe("HTTP API", () => {
  test("Verification Method", async () => {
    const res = await supertest(app).get("/.well-known/did.json").expect(200);
    const verificationMethod = res.body.verificationMethod;
    assert.equal(verificationMethod.length, 1);
    assert.equal(verificationMethod[0].type, "JsonWebKey2020");

    const jwk = verificationMethod[0].publicKeyJwk;
    const x5uUrl = new URL(jwk.x5u);
    const resPem = await supertest(app).get(x5uUrl.pathname).expect(200);
    assert(resPem.text.includes("-----BEGIN CERTIFICATE-----"));
  });

  test("Document not found", async () => {
    await supertest(app).get("/unavailable-document/did.json").expect(404);
  });

  test("Sign and store document", async () => {
    const toSign = {
      "@context": ["https://www.w3.org/ns/credentials/examples/v2"],
      type: ["MyPrototypeCredential"],
      credentialSubject: {
        mySubjectProperty: "mySubjectValue",
      },
    };
    const createRes = await supertest(app)
      .post("/my-document/did.json")
      .send(toSign)
      .expect(201);

    assert(
      createRes.body["@context"].includes(
        "https://www.w3.org/2018/credentials/v1",
      ),
    );
    assert(
      createRes.body["@context"].includes(
        "https://w3id.org/security/suites/jws-2020/v1",
      ),
    );
    assert(createRes.body["type"].includes("VerifiableCredential"));
    assert.equal(createRes.body.issuer, "did:web:127.0.0.1");
    assert.equal(createRes.body.id, "did:web:127.0.0.1:my-document");
    assert.deepStrictEqual(
      createRes.body.credentialSubject,
      toSign.credentialSubject,
    );
    assert.equal(createRes.body.proof.type, "JsonWebSignature2020");

    const getRes = await supertest(app)
      .get("/my-document/did.json")
      .expect(200);
    assert.deepStrictEqual(getRes.body, createRes.body);
  });
});
