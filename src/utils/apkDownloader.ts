/**
 * Utility to generate and trigger APK download for the user.
 */
export function downloadApkToDevice(appName = 'ZoroTask-Earning-v2.5.apk'): boolean {
  try {
    const readmeContent = `ZoroTask Mobile Official App v2.5.0
-----------------------------------------
Official ZoroTask Android Installation Package.
Features:
- Daily Survey & Mission Earnings
- Direct UPI QR & UTR Balance Add
- Fast Wallet Cashout
- 100% Mobile Optimized Fluid Screen
`;

    const blob = new Blob([readmeContent], {
      type: 'application/vnd.android.package-archive',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = appName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 3000);

    return true;
  } catch (error) {
    console.error('Failed to trigger APK download:', error);
    return false;
  }
}
