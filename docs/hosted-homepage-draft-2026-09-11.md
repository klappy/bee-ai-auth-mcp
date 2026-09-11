# Homepage review draft — September 11, 2026

Status: owner-approved visual presentation and exact copy on September 11, 2026 (kitchen verdict commit96e3b767). Shipment follows remaining technical and production-configuration gates. Protected preview: https://bee-validation-20260909.klappy.workers.dev/preview/ . This source commit is not deployment evidence.

Source: src/hosted-homepage.ts, consumed by src/hosted-homepage-preview.ts and the explicit release materializer, based on unchanged public/index.html blob f52d03c26bfc4b928099f851313d0b4834723419 and current stylesheet. The preview substitutes the current staging origin for the production MCP URL. Production public/index.html and the embedded public asset map are unchanged. Numeric free/paid usage remain unset. Settled rates remain $5/month and $24/year; no purchase button or live sale. The following is every visible page string in reading order; UI markup and exact punctuation are in the source.

Skip to setup 
 Bee, connected 
 Connect Plans Help 
 Homepage draft — review only. This describes the intended launch experience. Immediate free access and paid upgrades are not enabled yet. 
 Hosted by Klappy 
 Your Bee, in the AI you already use. 
 Bring conversations your Bee captured into your AI app. Verify your email, connect your own Bee , and start with free usage that renews each month. 
 Your connector URL 
 Copy URL 
 Use this address when your AI app asks for a server URL. 
 Choose your AI app ↓ 
 Before you start Three things to have ready. 
 An inbox you can open. Sign in with the code emailed to you. No GitHub or Cloudflare account is required. 
 An AI app that supports custom connectors. Availability depends on your app, plan and workspace settings. 
 Your Bee app, signed in on your phone. You'll approve the connection there. You do not install or run Bee CLI. 
 1 · Choose your app Same URL. Your choice of AI. 
 Start in your AI app's web version. Menu names and availability can vary by account; the official guides below cover the latest options. 
 Claude Custom connector Add Bee as a custom connector using the URL above, then complete email sign-in and Bee approval. Enable Bee in the conversation where you want to use it. Claude's official connector guide ↗ 
 ChatGPT OAuth connection Create a custom app using the URL above and choose OAuth . Complete email sign-in and Bee approval, then select Bee in your conversation. OpenAI's official developer-mode guide ↗ 
 Grok Custom connector If your account offers custom connectors, add the URL above and follow the authentication prompts. Complete email sign-in and Bee approval before asking your question. Grok's official connector guide ↗ 
 These guides describe each platform's supported setup. They are not a promise that every account or device has been tested with this service. 
 2 · Sign in & pair Connect your Bee. 
 1 Verify your email Enter your email, check your inbox, and enter the sign-in code. Then continue to connect your own Bee account. 
 2 Approve in your Bee app The hosted service runs Bee's official CLI and shows you the approval link or QR that CLI generates. On your phone, tap Open in the Bee app . On a computer, scan the QR with your Bee app. You do not install or run the CLI yourself. The Bee app may label the approval Bee CLI . 
 3 Return to your AI app After you approve, the hosted service finishes the connection. Complete any remaining prompts and enable Bee for your conversation. You don't need to paste a Bee token into chat. 
 If the scanner is missing, enable Developer Mode in the Bee app by tapping its app Version five times. The pairing screen also offers a connect URL for the Bee app's Enter Bee ID field. Bee's guide ↗ 
 3 · Try it Start with one question. 
 Use Bee to find my most recent conversation. Tell me when it happened and summarize its main points. If you can't access Bee, say so. 
 A successful response uses Bee and identifies a conversation from your account. If it only gives general advice, ask it to use the Bee connector. No recordings yet? Try again after a conversation appears in your Bee app. 
 Plans Start free. Upgrade when you need more. 
 The connector brings your existing Bee account into your AI app. Bee hardware, Bee services and your AI app's subscription are separate. 
 1 Free — renews monthly A monthly allowance for reading your Bee through the connector. Your usage view shows what remains and when it renews. If you reach the allowance, your connection stays intact; wait for renewal or choose Standard when upgrades are available. 
 2 Standard For people who need more than the free allowance. Paid signup is not open yet; included usage will be shown before purchase. $5/month $24/year — $2/month equivalent 
 Your account · Your choice Know what you're connecting. 
 This service can read your Bee conversations; it does not edit or delete them. Each connection uses the Bee account you approve, not Klappy's account. 
 Klappy operates the hosted service. It holds your Bee credential in an encrypted connection grant and processes retrieved data on the way to your AI app. This means trusting Klappy and the hosting infrastructure with that access. Your AI provider receives the material you retrieve, subject to its own settings and policies. 
 Disconnect Bee in your AI app when you no longer want to use it there. That does not erase material already included in chats. For help removing hosted access or revoking Bee authorization, ask Klappy. 
 If something gets stuck A few quick fixes. 
 I can't sign in or haven't received a code Check that you entered the right email and look in your spam folder for the sign-in code. If it still does not arrive, ask Klappy for help. You don't need to create a GitHub or Cloudflare account or change server settings. 
 I can't find the connector option Try the web version and check your app's guide above. Your plan or workspace permissions may restrict custom connections. 
 The Bee link or QR code isn't working Make sure Bee is installed and signed in. Try the pairing screen's connect URL in Bee's Enter Bee ID field, or restart the connection so the hosted service can generate a fresh CLI approval. Use the link or QR from your own sign-in. 
 Connected, but Bee won't answer Enable Bee in the conversation and try once more. If the error persists, tell Klappy which AI app you used and the error message. Keep Bee tokens, pairing codes and private conversation text out of screenshots. 
 Bee · a klappy.dev service Privacy & access Source · MIT

