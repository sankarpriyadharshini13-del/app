import AsyncStorage from '@react-native-async-storage/async-storage'
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
let uid: string | null = null
async function getUid() {
  if (uid) return uid
  uid = await AsyncStorage.getItem('uid')
  if (!uid) { uid = Math.random().toString(36).slice(2) + Date.now().toString(36); await AsyncStorage.setItem('uid', uid) }
  return uid
}
export const api = async (path: string, method = 'GET', body?: unknown) => {
  const r = await fetch(`${BASE}/api/${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'x-uid': await getUid() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = r.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`API returned HTTP ${r.status} with a non-JSON response`)
  }
  const data = await r.json()
  if (!r.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `API returned HTTP ${r.status}`)
  }
  return data
}
