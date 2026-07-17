export async function requestNatureWalk(payload, fetchImpl = fetch) {
  return postJson('/api/walk', payload, fetchImpl)
}

export async function fetchBirdSound(scientificName, fetchImpl = fetch) {
  const data = await postJson('/api/bird-sounds', { scientificName }, fetchImpl)
  return data.sound || null
}

async function postJson(url, payload, fetchImpl) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The service is temporarily unavailable')
  return data
}
