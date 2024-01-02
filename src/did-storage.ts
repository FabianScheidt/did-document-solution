import { signVerifiableCredential } from "@fabianscheidt/verifiable-credential-signer";
import { JsonLdObj } from "jsonld/jsonld-spec";

export abstract class DidStorage {
  public constructor(public readonly pemPrivateKey: string) {}

  public async signAndStoreDidDocument(
    body: JsonLdObj,
    hostname: string,
    didPath: string,
  ) {
    // Determine verification method and did subject
    const verificationMethod = `did:web:${hostname}`;
    const didSubject = `${verificationMethod}:${didPath}`;

    // Do not sign again, if signature is already present
    if ("issuer" in body && "issuanceDate" in body && "proof" in body) {
      if (body["id"] !== didSubject) {
        throw new Error(
          `A signature is present, but the subject ${body["id"]} does not match the target ${didSubject}`,
        );
      }
      await this.storeDidDocument(body, didPath);
      return body;
    }

    // Set issuer and issuance date
    body["issuer"] = verificationMethod;
    body["issuanceDate"] = new Date().toISOString();

    // Determine and set the did subject. Ensure that there is no conflicting @id.
    // https://www.w3.org/TR/did-core/#did-subject
    body["id"] = didSubject;
    delete body["@id"];

    // Sign, store and return the credential
    const signed = await signVerifiableCredential(
      this.pemPrivateKey,
      verificationMethod,
      body,
    );
    await this.storeDidDocument(signed, didPath);
    return signed;
  }

  public abstract storeDidDocument(
    body: JsonLdObj,
    didPath: string,
  ): Promise<void>;

  public abstract retrieveDidDocument(didPath: string): Promise<JsonLdObj>;
}
