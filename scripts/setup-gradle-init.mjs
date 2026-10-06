import fs from 'fs';
import path from 'path';
import os from 'os';

try {
  // 1. Create Gradle global init.d script to resolve Kotlin stdlib duplicate class conflicts
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
`;
  fs.writeFileSync(path.join(initDir, 'fix-kotlin-duplicates.gradle'), gradleInitContent.trim() + '\n', 'utf8');
  console.log('✓ Gradle init.d Kotlin duplicate class resolver configured.');

  // 2. If android/app/build.gradle already exists (e.g. during capacitor:copy:after), patch it & copy ZoroTask icon
  const appBuildGradle = path.resolve(process.cwd(), 'android', 'app', 'build.gradle');
  if (fs.existsSync(appBuildGradle)) {
    let content = fs.readFileSync(appBuildGradle, 'utf8');
    if (!content.includes('kotlin-bom')) {
      content = content.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation platform('org.jetbrains.kotlin:kotlin-bom:1.8.22')`
      );
      fs.writeFileSync(appBuildGradle, content, 'utf8');
      console.log('✓ Patched android/app/build.gradle with kotlin-bom:1.8.22');
    }
  }
} catch (err) {
  console.warn('Gradle init setup notice:', err);
}
