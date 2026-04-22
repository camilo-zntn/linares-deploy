import { OAuth2Client } from 'google-auth-library';
import * as http from 'http';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados en .env');
  process.exit(1);
}

const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/auth/callback';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://mail.google.com/'],
  prompt: 'consent',
  redirect_uri: redirectUri
});

const server = http.createServer(async (req, res) => {
  try {
    // Actualizar path en la URL
    const code = new URL(req.url!, redirectUri).searchParams.get('code');
    if (code) {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Refresh Token:', tokens.refresh_token);
      res.end('Puedes cerrar esta ventana');
      server.close();
    }
  } catch (error) {
    console.error('Error:', error);
    res.end('Error obteniendo tokens');
  }
});

