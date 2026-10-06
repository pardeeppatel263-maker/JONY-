/**
 * Utility to trigger direct download of the compiled ZoroTask Official Android APK (.apk).
 */
export function downloadApkToDevice(appName = 'ZoroTask-Official.apk'): boolean {
  try {
    const link = document.createElement('a');
    link.href = '/ZoroTask-Official.apk';
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
