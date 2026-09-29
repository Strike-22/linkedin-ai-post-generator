import axios from 'axios';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'];
const TOKEN_STORE_PATH = path.join(__dirname, '..', 'token-store.json');

async function readTokenStore() {
  try {
    const data = await fs.readFile(TOKEN_STORE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function getLinkedInToken() {
  const store = await readTokenStore();
  if (store?.access_token) return store.access_token;
  if (process.env.LINKEDIN_ACCESS_TOKEN) return process.env.LINKEDIN_ACCESS_TOKEN;
  throw new Error('No LinkedIn token found. Run OAuth flow first.');
}

async function getPersonUrn() {
  const store = await readTokenStore();
  if (store?.personUrn) return store.personUrn;
  if (process.env.LINKEDIN_PERSON_URN) {
    const match = process.env.LINKEDIN_PERSON_URN.match(/urn:li:person:[A-Za-z0-9_-]+/);
    if (match) return match[0];
  }
  throw new Error('No LinkedIn person URN found. Run OAuth flow first.');
}

export async function getMyProfile() {
  const token = await getLinkedInToken();
  const res = await axios.get(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    personUrn: `urn:li:person:${res.data.sub}`,
    name: res.data.name,
    email: res.data.email,
  };
}

export function getAuthorizationUrl(state) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI in .env');
  }

  const url = new URL(`${LINKEDIN_AUTH_BASE}/authorization`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', LINKEDIN_SCOPES.join(' '));

  return url.toString();
}

export async function exchangeCodeForToken(code) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, or LINKEDIN_REDIRECT_URI in .env');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await axios.post(`${LINKEDIN_AUTH_BASE}/accessToken`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.data;
}

export async function getProfileFromToken(accessToken) {
  const res = await axios.get(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    personUrn: `urn:li:person:${res.data.sub}`,
    name: res.data.name,
    email: res.data.email,
    raw: res.data,
  };
}

export async function publishToLinkedIn(postText) {
  const token = await getLinkedInToken();
  const personUrn = await getPersonUrn();

  const response = await axios.post(
    `${LINKEDIN_API_BASE}/ugcPosts`,
    {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: postText },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const id = response.headers['x-restli-id'];

  return {
    id,
    url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined,
  };
}

async function registerImageUpload({ token, personUrn }) {
  const response = await axios.post(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const uploadMechanism = response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];

  return {
    asset: response.data.value.asset,
    uploadUrl: uploadMechanism.uploadUrl,
  };
}

export async function publishToLinkedInWithImage(postText, imageFile) {
  const token = await getLinkedInToken();
  const personUrn = await getPersonUrn();

  if (!imageFile?.path) {
    throw new Error('Image file is required');
  }

  const { asset, uploadUrl } = await registerImageUpload({ token, personUrn });
  const imageBuffer = await fs.readFile(imageFile.path);

  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': imageFile.mimetype || 'application/octet-stream',
    },
    maxBodyLength: Infinity,
  });

  const response = await axios.post(
    `${LINKEDIN_API_BASE}/ugcPosts`,
    {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: postText },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: {
                text: 'Educational topic image',
              },
              media: asset,
              title: {
                text: 'Learning post image',
              },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const id = response.headers['x-restli-id'];

  return {
    id,
    asset,
    url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined,
  };
}
