import axios from 'axios'

const API = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v20.0'}`

export async function exchangeCodeForToken(params: {
  code: string
  redirectUri: string
}) {
  const { data } = await axios.get(`${API}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: params.redirectUri,
      code: params.code,
    },
  })
  return data as { access_token: string; token_type: string; expires_in: number }
}

export async function exchangeLongLivedUserToken(userToken: string) {
  const { data } = await axios.get(`${API}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: userToken,
    },
  })
  return data as { access_token: string; token_type: string; expires_in: number }
}

export async function getPages(userToken: string) {
  const { data } = await axios.get(`${API}/me/accounts`, {
    params: { fields: 'id,name,access_token' },
    headers: { Authorization: `Bearer ${userToken}` },
  })
  return data as { data: Array<{ id: string; name: string; access_token: string }> }
}

export async function subscribePage(pageId: string, pageAccessToken: string) {
  const { data } = await axios.post(
    `${API}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields:
          'messages,messaging_postbacks,message_deliveries,message_reads',
      },
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    }
  )
  return data
}

export async function unsubscribePage(pageId: string, pageAccessToken: string) {
  const { data } = await axios.delete(`${API}/${pageId}/subscribed_apps`, {
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  })
  return data
}

export async function sendMessage(
  pageId: string,
  pageAccessToken: string,
  body: Record<string, unknown>,
) {
  const { data } = await axios.post(`${API}/${pageId}/messages`, body, {
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  })
  return data
}

export async function getUserProfile(psid: string, pageAccessToken: string) {
  const { data } = await axios.get(`${API}/${psid}`, {
    params: { fields: 'name,picture' },
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  })
  return data as { name?: string; picture?: { data?: { url?: string } } }
}

export async function getSticker(stickerId: number, pageAccessToken: string) {
  const { data } = await axios.get<{ animated_gif_url?: string }>(
    `${API}/${stickerId}`,
    {
      params: { fields: 'animated_gif_url' },
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    },
  )
  return data
}

