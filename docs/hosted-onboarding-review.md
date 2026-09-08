# Hosted onboarding — exact copy for approval

Draft: not approved for publication. This is target-state hosted onboarding: Klappy-approved email, inbox code, then Bee approval via the hosted Bee CLI's generated link or QR. It depends on verified release of auth PR34, including Cloudflare config and hosted E2E. Runtime, auth, allow-list and artwork are unchanged by this homepage PR. Do not publish or invite brother testing before those gates, homepage validation, and exact public-copy approval. This draft does not claim the hosted CLI broker is live.

## Exact homepage text

The following preserves the homepage's wording, including expandable guides and links. Copy success: “Copied. Paste this URL into your AI app.” Clipboard fallback: “Select and copy the URL above, then paste it into your AI app.”

[Skip to setup](#main)

[ Bee, connected](/)

[Connect](#connect)[Help](#help)

For friends & family · Hosted by Klappy

### Your Bee, in the AI you already use.

Ask Claude, ChatGPT or Grok about conversations your Bee captured. Klappy hosts the connection; you connect **your own Bee account**.

Your connector URL

`https://bee.klappy.dev/mcp`

Copy URL

Use this address when your AI app asks for a server URL.

[Choose your AI app ↓](#connect)

Before you start

#### Three things to have ready.

- **An invitation from Klappy.** Tell him which email you want to use so he can approve access.
- **Access to that inbox.** Sign in with the code emailed to you. No GitHub or Cloudflare account is required.
- **Your Bee app, signed in on your phone.** You'll approve the connection there. You do not install or run Bee CLI. Your AI account must also support custom connectors.

1 · Choose your app

#### Same URL. Your choice of AI.

Start in your AI app's web version. Menu names and availability can vary by account; the official guides below cover the latest options.

Claude Custom connector

- Open Claude's **Customize → Connectors** area. Use **+** to add a custom connector.
- Name it **Bee**, paste the connector URL above, and add it. Follow the sign-in and Bee pairing steps below.
- In a conversation, use the composer's **+ → Connectors** menu to enable Bee.

Free accounts can add one custom connector. For a managed team or enterprise account, an owner may need to set it up first.

[Claude's official connector guide ↗](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)

ChatGPT Developer-mode app

- On ChatGPT web, open **Settings → Security and login** and turn on **Developer mode**.
- Open **Plugins** and create a developer-mode app. Name it **Bee**, use the connector URL above, and choose **OAuth** authentication.
- Complete sign-in and Bee pairing below, then select Bee from the available apps/tools in your conversation.

This setup is available on eligible Plus, Pro, Business, Enterprise and Education accounts. Workspace permissions can limit creation. If the option is missing, check the official guide or ask your workspace admin.

[OpenAI's official developer-mode guide ↗](https://developers.openai.com/api/docs/guides/developer-mode)

Grok Custom connector

- Open [Grok's Connectors page](https://grok.com/connectors). Choose **New Connector → Custom**.
- Enter the connector URL above and follow the authentication prompts, then complete the Bee pairing steps below.
- Return to Grok and use Bee for your question.

Custom connectors are available to all users. Business and Enterprise workspaces require admin provisioning.

[Grok's official connector guide ↗](https://docs.x.ai/grok/connectors)

These guides describe each platform's supported setup. They are not a promise that every account or device has been tested with this service.

2 · Sign in & pair

#### Connect your Bee.

1

##### Sign in with your approved email

Enter the email Klappy approved, check your inbox, and enter the sign-in code. Already using GitHub with Bee? That sign-in option is still available.

2

##### Approve in your Bee app

The hosted service runs Bee's official CLI and shows you the approval link or QR that CLI generates. On your phone, tap **Open in the Bee app**. On a computer, scan the QR with your Bee app. You do not install or run the CLI yourself. The Bee app may label the approval **Bee CLI**.

3

##### Return to your AI app

After you approve, the hosted service finishes the connection. Complete any remaining prompts and enable Bee for your conversation. You don't need to paste a Bee token into chat.

If the scanner is missing, enable Developer Mode in the Bee app by tapping its app Version five times. The pairing screen also offers a connect URL for the Bee app's **Enter Bee ID** field. [Bee's guide ↗](https://docs.bee.computer/docs/developer-mode)

3 · Try it

#### Start with one question.

> Use Bee to find my most recent conversation. Tell me when it happened and summarize its main points. If you can't access Bee, say so.

A successful response uses Bee and identifies a conversation from your account. If it only gives general advice, ask it to use the Bee connector. No recordings yet? Try again after a conversation appears in your Bee app.

Your account · Your choice

#### Know what you're connecting.

This service can read your Bee conversations; it does not edit or delete them. Each connection uses the Bee account you approve, not Klappy's account.

**Klappy operates the hosted service.** It holds your Bee credential in an encrypted connection grant and processes retrieved data on the way to your AI app. This means trusting Klappy and the hosting infrastructure with that access. Your AI provider receives the material you retrieve, subject to its own settings and policies.

Disconnect Bee in your AI app when you no longer want to use it there. That does not erase material already included in chats. For help removing hosted access or revoking Bee authorization, ask Klappy.

[More about access & privacy →](/security)

If something gets stuck

#### A few quick fixes.

I can't sign in or haven't received a code

Use the email Klappy approved and check your spam folder for the sign-in code. If you still can't get in, ask Klappy to check your invitation. You don't need to create a GitHub or Cloudflare account or change server settings.

I can't find the connector option

Try the web version and check your app's guide above. Your plan or workspace permissions may restrict custom connections.

The Bee link or QR code isn't working

Make sure Bee is installed and signed in. Try the pairing screen's connect URL in Bee's Enter Bee ID field, or restart the connection so the hosted service can generate a fresh CLI approval. Use the link or QR from your own sign-in.

Connected, but Bee won't answer

Enable Bee in the conversation and try once more. If the error persists, tell Klappy which AI app you used and the error message. Keep Bee tokens, pairing codes and private conversation text out of screenshots.

Bee · a klappy.dev service[Privacy & access](/security)[For developers: self-host](/setup)[Source · MIT](https://github.com/klappy/bee-ai-auth-mcp)

## Sources

Official pages verified by coordinator on 2026-09-08:
- Claude: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- ChatGPT: https://developers.openai.com/api/docs/guides/developer-mode
- Grok: https://docs.x.ai/grok/connectors
- Bee app help already linked by product: https://docs.bee.computer/docs/developer-mode
- Hosted pairing architecture (bound, not live): kitchen `rail/3-pass/2026-08-13-bee-relay-cf-access/CLI-BROKER-AMENDMENT-2026-09-08.md` at `2c4d263e7b8f448c2d28b698a66d05ffb2258be9`.
- Auth capability checkpoint: kitchen `rail/3-pass/2026-08-13-bee-relay-cf-access/EXECUTION-CHECKPOINT-2026-09-08.md` at `875bf92164961168b23a46bb2e066b95b4186e19`. PR34 remains open and unmerged; CLI-broker implementation and hosted E2E are remaining gates. Do not treat current `src/pairing.ts` Worker handshake as the hosted invitee architecture.

## Limits and supporting corrections

Supporting pages distinguish invited hosted users from self-host developers; correct single-tenant custody claims and avoid treating client disconnect as verified grant deletion. Public-registration and broader hardening gates remain open.

Existing runtime consent says “fine for self-hosting” and links /setup; setup now begins with a hosted-guide callout. Existing denial errors mention server configuration; homepage help tells invitees to ask Klappy. Runtime wording is outside this ticket's product edits.

Checks: static HTML IDs and local link targets, plus executable clipboard success and unavailable-API fallback mocks. Homepage invitee copy no longer describes Worker pairing-registration impersonation; GitHub signup/prerequisite text remains absent. No browser/visual QA, authenticated pairing or end-to-end retrieval was performed. Official client support does not prove tested compatibility for every app/account. This draft does not claim PR34 or the hosted CLI broker is live.
