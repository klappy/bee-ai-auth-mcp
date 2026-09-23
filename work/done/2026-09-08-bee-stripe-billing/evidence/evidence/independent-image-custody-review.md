# Independent image and custody acceptance

Reviewer: `/root/auggie_image/image_review`, separate from the image and custody authors. Reviewed 2026-09-09. Verdict: **PASS for one private fixed-nonce registry upload only**. This receipt does not delay the already accepted push.

Accepted image: `sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306`.

## Exact accepted code

| File | SHA256 |
| --- | --- |
| `assemble.py` | `ffd436bce7f34803176bbf49a83725d1a1c59a498c7f6d7d416359a99fe7a4a7` |
| `custody.py` | `6faab0f1bd3934a147df1d0caa1f9a76a197d07a275da4ce66b0b98676baff8c` |
| `issue-encrypted.js` | `0d8699740f6bef80184d81a31b32e266c62744177d07c3fecc17291dabd286b8` |
| `test_custody.py` | `a90fdcf3999275050af86a181ce7ec9a00686ca7dfbe6f716240604aa3f46fd0` |

## Immutable inputs and actual checks

Resolved Linux amd64 manifests recorded by Otto and checked against local material:

| Input | Manifest digest |
| --- | --- |
| `gcr.io/distroless/base-debian12:nonroot` | `sha256:5883c320d81f76c764e114c9ab14054f037bb040907816fc9028d80d9602a7c3` |
| `caddy:2-builder` | `sha256:8c78bf0a666541cd56e36ea40d02f1c84847a2b4fd490f600aa38f7221d73c67` |
| `oven/bun:1.2-debian` | `sha256:11ec60524072cb42ed7e92cbeea9c6c1781da7d50db6d4bd57b5162e6685b25d` |

Manifest identity uses the resolved registry digest, never a reserialized or newline-stripped JSON hash. The intermediate base value `9e105ad952fa4fe4f506a70e3aa7c2871bafb632750ddcc63d93a7616b2494e8` was a newline-processing artifact and is superseded. Initial `bun.tar` was truncated and is not accepted provenance. The successful immutable `bun-oci` pull was independently checked, including every blob and the exact extracted compiler SHA256 `b8c8e67bd0476593f50b8ba2f1f203210e6b3cfa1bc1a81f82bda109318118c9`.

Reviewer independently checked base and Caddy archive configuration/layer hashes, all 112 recorded Bee source/package files against the pinned codeload archive and installed sources at commit `e67032d59bdfdc7f3bc73dd67683328c3e0d58b2`, and frozen broker source SHA256 `d608eecca1120db42ebf541d594157387dc9f5b14df1e23a53b0b387fd2f324c` against the recorded compile command.

All final compressed blob sizes/hashes and all 15 uncompressed layer diff IDs match. The added layer contains exactly three binaries and the approved Caddyfile/CA certificate, with executable 0755/configuration 0644 and root ownership. Linux amd64, user 65532:65532, entrypoint, environment and ports match the Dockerfile runtime contract. Compressed blobs including configuration total 103,556,232 bytes; including the manifest, 103,558,813 bytes.

Caddy is static. Reviewer independently reran Bee and broker probe copies with only their same-length ELF interpreter field redirected to the extracted distroless loader, distroless library paths, and immediate symbol binding (`LD_BIND_NOW=1`). Bee printed its real command help with exit 0; broker rejected invalid ID with exit 2; neither emitted stderr. Copies differ only in the interpreter field; shipped binaries are unchanged. Direct-loader generic Bun help and mixed host-loader/libc failures are not compatibility evidence. No container or hosted execution is claimed.

## Custody disposition

Reviewer ran `python -m unittest discover -v`: eight tests passed, including actual issuance JavaScript WebCrypto-to-Python dummy encryption, tamper rejection, strict destinations, redirect/auth refusal, success/failure upload sequences, anonymous-access failure, secret-bearing exceptions and key/ciphertext cleanup. Fixed HTTPS host and account/repository paths prevent sending the account-wide credential to other destinations. No proxy/netrc, redirect following, write retries, or credential logging is implemented in the local transport. Provider tooling may internally retry; no exactly-once credential issuance guarantee is claimed.

The concrete lost-response finding was repaired: upload start/blob commit/manifest PUT are recorded as attempted with unknown outcome before the network call, avoiding false claims of no mutation. Credentials request pull/push for 15 minutes, are encrypted before leaving provider tooling, and decrypted only in local process memory. Local key/ciphertext cleanup is not provider revocation or physical-erasure proof.

One roughly 0.104 GB image, no runtime start, no new subscription and scoped cleanup are reasonable within the existing $5 allowance. Published storage comparisons are estimates, not a verified managed-registry tariff or provider-enforced cap.

Acceptance permits only the reviewed helper to issue and upload to `registry.cloudflare.com/b03e6ea242724c05eb97eb732cceb21d/bee-validation-20260909-455501a57e820ab6c3eb927b699d02cb:ea68e53edb8e`, with exact digest/length readbacks, anonymous denial and safe cleanup receipt. At this verdict no successful provider push was observed. Association, activation, hosted CLI/grant flow, production changes, public publication, invitees and Stripe are outside this acceptance.

## Accepted transport correction

The first encrypted issuance succeeded, but the uploader's initial authenticated HEAD failed before contacting the registry: direct DNS reproduced `gaierror`, errno -3. The author reports local key/ciphertext cleanup and no registry write. Normal configured runtime loopback proxy CONNECT reached the fixed anonymous registry HEAD with 401; this is a transport correction, not an authorization-denial workaround.

Revised accepted `custody.py` SHA256: `3b8b4a09e24f5b29e26cec5f898d6a7d4482fa820365241936c5c840a1c950db`; revised tests: `4ca5fdef4dad21cbf3c3dff0b4e7a0dc04a88623f1fad8e0ae8a2770e589fabd`. Issuance JavaScript and image are unchanged. These hashes supersede the custody/test hashes above for this correction.

Reviewer inspected the bounded delta and ran all ten tests successfully. Only the configured HTTP loopback proxy is permitted; remote proxy, credentials in its URL, nontrivial path, query and fragment are rejected. CONNECT targets only `registry.cloudflare.com:443`, without Authorization headers. Reviewer inspected the installed Python HTTPSConnection implementation: after CONNECT, TLS SNI/hostname verification uses that fixed registry hostname. Authorization remains inside verified TLS. Redirect refusal and destination restrictions remain in force. Safe exception output retains only a class whitelist and numeric errno. **PASS for one replacement encrypted issuance and fixed-nonce upload**, requiring the same actual readbacks and cleanup; no further retry permission is inferred.

## Separate association executable acceptance

`create-association.js` SHA256 `26e0f4171d29acea416a258ce369e0adbd2c6f2dfdc852eceef3ef0048e5e702`: **PASS for one isolated application association after actual successful private-registry upload receipt at the accepted digest**. No provider association outcome is claimed here.

Fresh live provider schema supports default scheduling, configuration image/basic/logs disabled, instances 0, maximum 1, and association with namespace `5b99701b01df4b2b886be69a0202a0e9`. Reviewer required and verified corrections adding an explicit fixed account guard before any requests and successful creation status 201/default scheduling readbacks. Reviewer independently ran five mock cases: success, wrong account, collision, lost POST response, unexpected instance; all passed.

The executable checks complete application inventory, sole namespace ownership, closed validation window, disabled ingress and logging, no secret binding, exact immutable image, desired zero/maximum one/basic, actual instances empty, and unchanged isolated Worker/settings/subdomain plus isolated and production deployments. Unknown write outcomes halt for owned read-only reconciliation. Conservative inventory/property-order comparison failure never authorizes duplicate creation. This acceptance does not authorize a runtime start, activation, namespace deletion, unrelated cleanup, production change or hosted-service completion claim.
