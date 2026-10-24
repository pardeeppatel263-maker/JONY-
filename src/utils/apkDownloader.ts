/**
 * High-speed utility to trigger direct instant download of the ZoroTask Official Android APK (.apk).
 * Uses cache-busting timestamp so the user's browser/device always downloads the newest version.
 */
export function downloadApkToDevice(
  appName = 'ZoroTask-Official-v2.6.apk',
  customUrl?: string
): boolean {
  try {
    let rawUrl = customUrl;
    if (!rawUrl || rawUrl.trim() === '') {
      rawUrl = '/ZoroTask-Official.apk';
    }

    // Ensure full absolute path if relative
    let absoluteUrl = rawUrl;
    if (typeof window !== 'undefined' && rawUrl.startsWith('/')) {
      absoluteUrl = `${window.location.origin}${rawUrl}`;
    }

    const separator = absoluteUrl.includes('?') ? '&' : '?';
    const freshUrl = `${absoluteUrl}${separator}t=${Date.now()}`;

    // 1. Create a native anchor link with direct download attribute
    const link = document.createElement('a');
    link.href = freshUrl;
    link.download = appName;
    link.setAttribute('download', appName);
    link.setAttribute('rel', 'noopener noreferrer');
    link.style.position = 'fixed';
    link.style.top = '-9999px';
    link.style.left = '-9999px';
    link.style.opacity = '0';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      } catch {}
    }, 2000);

    return true;
  } catch (error) {
    console.error('Failed to trigger APK download, trying direct navigation:', error);
    try {
      if (typeof window !== 'undefined') {
        const fallback = `${window.location.origin}/ZoroTask-Official.apk?t=${Date.now()}`;
        window.location.href = fallback;
      }
      return true;
    } catch {
      return false;
    }
  }
}
