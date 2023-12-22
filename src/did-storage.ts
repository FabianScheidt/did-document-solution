import { signVerifiableCredential } from "@fabianscheidt/verifiable-credential-signer";
import { JsonLdObj } from "jsonld/jsonld-spec";

export abstract class DidStorage {
  public constructor(public readonly pemPrivateKey: string) {}

  public async signAndStoreDidDocument(
    body: JsonLdObj,
    hostname: string,
    didPath: string,
  ) {
    // Determine verification method and use it as issuer
    const verificationMethod = `did:web:${hostname}`;
    body["issuer"] = verificationMethod;
    body["issuanceDate"] = new Date().toISOString();

    // Determine and set the id
    body["@id"] = `${verificationMethod}:${didPath}`;

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
