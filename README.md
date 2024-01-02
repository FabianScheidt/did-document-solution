# DID Document Solution

Signs DID documents, stores them and makes them available through [did:web](https://w3c-ccg.github.io/did-method-web/).

This service provides a POST endpoint to store DID documents. Before storing, documents are assigned an `@id`, which is
inferred from the request URL. The document is [signed](https://github.com/FabianScheidt/verifiable-credential-signer)
and a suitable `issuer`, `issuanceDate` and `verificationMethod` is added. Note that existing documents are overwritten.

Stored documents can be retrieved through a GET endpoint. The corresponding public key is
[served](https://github.com/FabianScheidt/did-web-verification-method-server) as well.

The did:web specification assumes that all documents are served via HTTPS. In addition, this service assumes to be
exposed on the default port 443. You will need to configure your load balancer accordingly. In addition, you should take
measures so that the `POST` API is not publicly accessible (e.g., by adding authentication through the load balancer).

## Configuration Options

The service is configured via environment variables.

| Configuration          | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `KEY`                  | PEM-formatted private key (required)                                       |
| `CERTIFICATE`          | PEM-formatted certificate chain (required)                                 |
| `ADD_ROOT_CERTIFICATE` | Enable to add root certificate to the certificate chain (defaults to true) |
| `PORT`                 | Port to expose the service (defaults to 3000)                              |
| `STORAGE_PATH`         | Port to expose the service (defaults to _./did-documents_)                 |

## Endpoints

| Endpoint                                     | did:web                       | Description                                |
| -------------------------------------------- | ----------------------------- | ------------------------------------------ |
| `GET  https://<domain>/.well-known/did.json` | `did:web:<domain>`            | Returns the verification method            |
| `POST https://<domain>/<did-path>/did.json`  | `did:web:<domain>:<did-path>` | Signs stores and returns the request body. |
| `GET  https://<domain>/<did-path>/did.json`  | `did:web:<domain>:<did-path>` | Returns a previously stored document.      |
