import * as path from "path";
import { promises as fs } from "fs";
import { DidStorage } from "./did-storage";
import { JsonLdObj } from "jsonld/jsonld-spec";

export class FileBasedDidStorage extends DidStorage {
  public constructor(
    public readonly pemPrivateKey: string,
    public readonly storageDir: string,
  ) {
    super(pemPrivateKey);
  }

  public async retrieveDidDocument(didPath: string): Promise<JsonLdObj> {
    const filePath = this.getFilePath(didPath);
    const buffer = await fs.readFile(filePath);
    return JSON.parse(buffer.toString());
  }

  public async storeDidDocument(
    body: JsonLdObj,
    didPath: string,
  ): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    const filePath = this.getFilePath(didPath);
    await fs.writeFile(filePath, JSON.stringify(body, null, 2));
  }

  protected getFilePath(didPath: string): string {
    return path.join(this.storageDir, didPath + ".json");
  }
}
