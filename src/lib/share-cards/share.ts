// Web Share API wrapper for share-card PNGs. File sharing is mostly a
// mobile/PWA capability (iOS/Android); desktop browsers largely lack it, so
// callers hide the Share button when canShareFiles() is false and offer
// Download instead.

export function canShareFiles(): boolean {
  if (typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') {
    return false
  }
  const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' })
  try {
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

// Must be called synchronously from a user gesture (Safari enforces the
// gesture chain) with an already-rendered blob — never render inside it.
export async function shareCardBlob(
  blob: Blob,
  filename: string,
  title: string
): Promise<'shared' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' })
  try {
    await navigator.share({ files: [file], title })
    return 'shared'
  } catch (error) {
    // The user closing the share sheet is normal flow, not an error
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled'
    }
    throw error
  }
}
