import fs from 'fs';
import path from 'path';
import os from 'os';

try {
  const homeDir = os.homedir();
  const initDir = path.join(homeDir, '.gradle', 'init.d');
  fs.mkdirSync(initDir, { recursive: true });

  const gradleInitContent = `
allprojects {
    buildscript {
        configurations.all {
            resolutionStrategy.eachDependency { details ->
                if (details.requested.group == 'org.jetbrains.kotlin' && details.requested.name.startsWith('kotlin-stdlib')) {
                    details.useVersion '1.8.22'
                }
            }
        }
    }
    configurations.all {
        resolutionStrategy.eachDependency { details ->
            if (details.requested.group == 'org.jetbrains.kotlin' && details.requested.name.startsWith('kotlin-stdlib')) {
                details.useVersion '1.8.22'
            }
        }
    }
}

gradle.projectsLoaded {
    try {
        def androidRoot = gradle.rootProject.rootDir
        def iconFile = new File(androidRoot, "../public/app-icon.png")
        def resDir = new File(androidRoot, "app/src/main/res")

        if (iconFile.exists() && resDir.exists()) {
            ["mipmap-anydpi-v26", "mipmap-anydpi"].each { dirName ->
                def d = new File(resDir, dirName)
                if (d.exists()) {
                    d.deleteDir()
                }
            }

            def iconBytes = iconFile.bytes
            ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"].each { dirName ->
                def targetDir = new File(resDir, dirName)
                if (!targetDir.exists()) targetDir.mkdirs()
                ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"].each { fileName ->
                    new File(targetDir, fileName).bytes = iconBytes
                }
            }
            println("✓ Gradle Init: Replaced Android launcher icons with ZoroTask 3D Logo!")
        }

        def mainActivityFile = new File(androidRoot, "app/src/main/java/com/zorotask/app/MainActivity.java")
        if (mainActivityFile.exists()) {
            mainActivityFile.text = '''package com.zorotask.app;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            Window window = getWindow();
            if (window != null) {
                window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                WindowCompat.setDecorFitsSystemWindows(window, false);
                window.setStatusBarColor(Color.parseColor("#1D4ED8"));
                window.setNavigationBarColor(Color.parseColor("#0F172A"));

                View content = findViewById(android.R.id.content);
                if (content != null) {
                    content.setBackgroundColor(Color.parseColor("#1D4ED8"));
                    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, content);
                    if (controller != null) {
                        controller.setAppearanceLightStatusBars(false);
                        controller.setAppearanceLightNavigationBars(false);
                    }
                    ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
                        Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                        v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                        return WindowInsetsCompat.CONSUMED;
                    });
                }
            }
        } catch (Exception ignored) {}
    }
}
'''
            println("✓ Gradle Init: Patched MainActivity.java for status bar safe insets!")
        }
    } catch (Exception e) {
        println("Gradle Init notice: " + e.getMessage())
    }
}
`;

  fs.writeFileSync(path.join(initDir, 'fix-kotlin-duplicates.gradle'), gradleInitContent.trim() + '\n', 'utf8');
  console.log('✓ Gradle init.d configured for Kotlin, ZoroTask 3D App Icon, and Status Bar Insets.');
} catch (err) {
  console.warn('Gradle init setup notice:', err);
}
