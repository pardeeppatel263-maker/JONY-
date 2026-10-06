export const ZOROTASK_LOGO_PATH = '/src/assets/images/zorotask_app_logo_1791266560583.jpg';

/**
 * Downloads the 1024x1024 Square HD ZoroTask App Icon as a PNG file
 */
export const downloadZoroTaskIconHD = async (onComplete?: () => void) => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = ZOROTASK_LOGO_PATH;
    });

    if (loaded) {
      const canvas = document.createElement('canvas');
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ZoroTask-App-Logo-HD.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            if (onComplete) onComplete();
          }
        }, 'image/png', 1.0);
        return;
      }
    }

    // Fallback direct link download
    const a = document.createElement('a');
    a.href = ZOROTASK_LOGO_PATH;
    a.download = 'ZoroTask-App-Logo-HD.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onComplete) onComplete();
  } catch (err) {
    console.error('Logo download failed:', err);
  }
};

/**
 * Generates and downloads a 1280x540 Full Brand Logo Banner (Icon + ZoroTask Typography) as PNG
 */
export const downloadZoroTaskBrandBannerHD = async (onComplete?: () => void) => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = ZOROTASK_LOGO_PATH;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep royal navy-indigo gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 540);
    bgGrad.addColorStop(0, '#070d26');
    bgGrad.addColorStop(0.5, '#0f1d4d');
    bgGrad.addColorStop(1, '#091130');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 540);

    // Subtle golden glow behind icon
    const radial = ctx.createRadialGradient(270, 270, 30, 270, 270, 240);
    radial.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    radial.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 600, 540);

    // Draw rounded icon frame
    const iconX = 100;
    const iconY = 100;
    const iconSize = 340;
    const radius = 68;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, radius);
    ctx.clip();
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
    }
    ctx.restore();

    // Golden border around icon
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, radius);
    ctx.stroke();

    // Brand Title: "Zoro" (White) + "Task" (Gold)
    ctx.font = '900 132px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';

    const zoroText = 'Zoro';
    const taskText = 'Task';
    const textStartX = 495;
    const titleY = 235;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(zoroText, textStartX, titleY);
    const zoroWidth = ctx.measureText(zoroText).width;

    const goldGrad = ctx.createLinearGradient(textStartX + zoroWidth, titleY - 60, textStartX + zoroWidth + 300, titleY + 60);
    goldGrad.addColorStop(0, '#fde047');
    goldGrad.addColorStop(0.5, '#fbbf24');
    goldGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = goldGrad;
    ctx.fillText(taskText, textStartX + zoroWidth, titleY);

    // Subtitle Tagline
    ctx.font = '700 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.letterSpacing = '6px';
    ctx.fillText('BUY • SURVEY • EARN • GROW', textStartX + 4, 335);

    // Official Badge Pill
    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(textStartX + 4, 375, 470, 50, 25);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fcd34d';
    ctx.letterSpacing = '2px';
    ctx.fillText('★ OFFICIAL VIP VIDEO TASK PLATFORM', textStartX + 30, 401);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ZoroTask-Brand-Banner-HD.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        if (onComplete) onComplete();
      }
    }, 'image/png', 1.0);
  } catch (err) {
    console.error('Brand banner download failed:', err);
  }
};
