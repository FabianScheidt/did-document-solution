import { signVerifiableCredential } from "@fabianscheidt/verifiable-credential-signer";
import { JsonLdObj } from "jsonld/jsonld-spec";

export abstract class DidStorage {
  public constructor(public readonly pemPrivateKey: string) {}

  public async signAndStoreDidDocument(
    body: JsonLdObj & { type?: JsonLdObj["@type"] },
    hostname: string,
    didPath: string,
    issuer: string,
    verificationMethod: string,
    options?: { flavour?: "Specification" | "Gaia-X"; created?: string },
  ) {
    // Determine DID subject
    const didSubject = `did:web:${hostname}:${didPath}`;

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

    // Destructure body. Ensure that there is no conflicting @id or @type.
    const {
      ["@id"]: atId, // eslint-disable-line @typescript-eslint/no-unused-vars
      ["@type"]: atType, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...credential
    } = {
      ...body,

      // Set issuer and issuance date
      issuer,
      issuanceDate: new Date().toISOString(),

      // Determine and set the did subject: https://www.w3.org/TR/did-core/#did-subject
      id: didSubject,

      // Ensure we only have the type once
      type: body["type"] ?? body["@type"] ?? [],
    };

    // Sign, store and return the credential
    const signed = await signVerifiableCredential(
      this.pemPrivateKey,
      verificationMethod,
      credential,
      options,
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
