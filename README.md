# DID Document Solution

Signs DID documents, stores them and makes them available through [did:web](https://w3c-ccg.github.io/did-method-web/).

This service provides a POST endpoint to store DID documents. Before storing, documents are assigned an `@id`, which is
inferred from the request URL. The document is [signed](https://github.com/FabianScheidt/verifiable-credential-signer)
and a suitable `issuer`, `issuanceDate` and `verificationMethod` is added. Note that existing documents are overwritten.
The signature is only updated if no signature is present.

Stored documents can be retrieved through a GET endpoint. The corresponding public key is
[served](https://github.com/FabianScheidt/did-web-verification-method-server) as well.

The did:web specification assumes that all documents are served via HTTPS. In addition, this service assumes to be
exposed on the default port 443. You will need to configure your load balancer accordingly. In addition, you should take
measures so that the `POST` API is not publicly accessible (e.g., by adding authentication through the load balancer).

## Configuration Options

The service is configured via environment variables.

| Configuration               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KEY`                       | PEM-formatted private key (required)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CERTIFICATE`               | PEM-formatted certificate chain (required)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `ADD_ROOT_CERTIFICATE`      | Enable to add root certificate to the certificate chain (defaults to true)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `DEFAULT_SIGNATURE_FLAVOUR` | The specification is not explicit about how the signature payload is assembled. As a consequence, services related to "Gaia-X" have implemented a suite that differs from other implementations. This setting configures which "flavour" to use. Possible values are "Specification" to match the provided test vectors and "Gaia-X". The default of the HTTP API is "Gaia-X", to not introduce a breaking change in this realm. The setting can be overridden per request by setting the `X-Signature-Flavour` header. |
| `PORT`                      | Port to expose the service (defaults to 3000)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `STORAGE_PATH`              | Port to expose the service (defaults to _./did-documents_)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Endpoints

| Endpoint                                     | did:web                       | Description                                |
| -------------------------------------------- | ----------------------------- | ------------------------------------------ |
| `GET  https://<domain>/.well-known/did.json` | `did:web:<domain>`            | Returns the verification method            |
| `POST https://<domain>/<did-path>/did.json`  | `did:web:<domain>:<did-path>` | Signs stores and returns the request body. |
| `GET  https://<domain>/<did-path>/did.json`  | `did:web:<domain>:<did-path>` | Returns a previously stored document.      |

## Deployment

If you use Docker, there is a prebuilt image available, which is kept up to date with this repository:
[fabisch/did-document-solution:latest](https://hub.docker.com/r/fabisch/did-document-solution)

If you are looking to deploy this on Kubernetes, where you already have your TLS certificate stored in a secret, you
may find [this gist](https://gist.github.com/FabianScheidt/7b03806503b05d295cc8a9fcd62df2d9) useful.
