/**
 * High-speed utility to trigger direct instant download of the ZoroTask Official Android APK (.apk).
 * Uses cache-busting timestamp so the user's browser/device always downloads the newest version.
 */
export function downloadApkToDevice(appName = 'ZoroTask-Official-v2.6.apk', customUrl?: string): boolean {
  try {
    const rawUrl = customUrl || '/ZoroTask-Official.apk';
    const separator = rawUrl.includes('?') ? '&' : '?';
    const freshUrl = `${rawUrl}${separator}t=${Date.now()}`;

    // 1. High-speed direct link trigger
    const link = document.createElement('a');
    link.href = freshUrl;
    link.setAttribute('download', appName);
    link.setAttribute('rel', 'noopener noreferrer');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);

    return true;
  } catch (error) {
    console.error('Failed to trigger APK download, trying direct navigation:', error);
    try {
      window.location.href = `/ZoroTask-Official.apk?t=${Date.now()}`;
      return true;
    } catch {
      return false;
    }
  }
}
