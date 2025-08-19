// oauth-init.js
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

function loadOAuthClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id, redirect_uris } = creds.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

async function main() {
  const oAuth2Client = loadOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  console.log("👉 Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Paste the code from that page here: ", async (code) => {
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("✅ Token saved to", TOKEN_PATH);
  });
}

main().catch(err => console.error("❌ Error during OAuth init:", err));
