/**
 * Utility to trigger direct download of the latest compiled ZoroTask Official Android APK (.apk).
 * Uses cache-busting timestamp so the user's browser/device always downloads the newest version.
 */
export function downloadApkToDevice(appName = 'ZoroTask-Official-v2.6.apk', customUrl?: string): boolean {
  try {
    const rawUrl = customUrl || '/ZoroTask-Official.apk';
    // Append timestamp query parameter to bypass aggressive browser/CDN caching
    const separator = rawUrl.includes('?') ? '&' : '?';
    const freshUrl = `${rawUrl}${separator}t=${Date.now()}`;

    const link = document.createElement('a');
    link.href = freshUrl;
    link.setAttribute('download', appName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 3000);

    return true;
  } catch (error) {
    console.error('Failed to trigger APK download:', error);
    return false;
  }
}
