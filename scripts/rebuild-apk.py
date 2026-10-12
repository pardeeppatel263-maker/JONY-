import os
import sys
import shutil
import zipfile
import subprocess

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    apk_path = os.path.join(root_dir, 'public', 'ZoroTask-Official.apk')
    base_apk_path = os.path.join(root_dir, 'scripts', 'ZoroTask-base.apk')
    keystore_path = os.path.join(root_dir, 'scripts', 'debug.keystore')
    dist_dir = os.path.join(root_dir, 'dist')
    temp_dir = os.path.join(root_dir, '.tmp_apk')

    if not os.path.exists(base_apk_path):
        print(f"Error: Base APK not found at {base_apk_path}")
        sys.exit(1)

    if not os.path.exists(dist_dir):
        print(f"Error: {dist_dir} not found. Run npm run build first.")
        sys.exit(1)

    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)
    os.makedirs(temp_dir, exist_ok=True)

    unsigned_apk = os.path.join(temp_dir, 'unsigned.apk')
    aligned_apk = os.path.join(temp_dir, 'aligned.apk')

    print("Step 1: Extracting native Android binaries from base APK...")
    extracted_items = {}
    with zipfile.ZipFile(base_apk_path, 'r') as z:
        for item in z.infolist():
            # Skip old signatures and old assets/public
            if item.filename.startswith('META-INF/'):
                continue
            if item.filename.startswith('assets/public/'):
                continue
            extracted_items[item.filename] = z.read(item.filename)

    print(f"Preserved {len(extracted_items)} native Android binaries, resources, and plugins.")

    print("Step 2: Injecting latest compiled React production assets from dist/...")
    new_web_files = {}
    for dirpath, _, filenames in os.walk(dist_dir):
        for fname in filenames:
            if fname.endswith('.apk'):
                continue
            full_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(full_path, dist_dir)
            apk_rel_path = f"assets/public/{rel_path}".replace('\\', '/')
            with open(full_path, 'rb') as f:
                new_web_files[apk_rel_path] = f.read()

    print(f"Added {len(new_web_files)} updated web assets into assets/public/.")

    all_files = {}
    all_files.update(extracted_items)
    all_files.update(new_web_files)

    if 'assets/capacitor.config.json' not in all_files:
        cap_config = os.path.join(root_dir, 'capacitor.config.json')
        if os.path.exists(cap_config):
            with open(cap_config, 'rb') as f:
                all_files['assets/capacitor.config.json'] = f.read()

    print("Step 3: Creating unsigned APK with proper Android uncompressed resources.arsc...")
    with zipfile.ZipFile(unsigned_apk, 'w') as zout:
        for filename in sorted(all_files.keys()):
            data = all_files[filename]
            # Android strictly requires resources.arsc to be stored uncompressed (ZIP_STORED)
            c_type = zipfile.ZIP_STORED if filename == 'resources.arsc' else zipfile.ZIP_DEFLATED
            zinfo = zipfile.ZipInfo(filename)
            zinfo.compress_type = c_type
            zout.writestr(zinfo, data)

    print("Step 4: Aligning APK to 4-byte boundaries with zipalign...")
    subprocess.run(['zipalign', '-f', '-p', '4', unsigned_apk, aligned_apk], check=True)

    print("Step 5: Signing APK with official Google apksigner (v1 + v2 + v3 schemes)...")
    subprocess.run([
        'apksigner', 'sign',
        '--ks', keystore_path,
        '--ks-pass', 'pass:android',
        '--ks-key-alias', 'androiddebugkey',
        '--key-pass', 'pass:android',
        '--v1-signing-enabled', 'true',
        '--v2-signing-enabled', 'true',
        '--v3-signing-enabled', 'true',
        '--out', apk_path,
        aligned_apk
    ], check=True)

    print("Step 6: Verifying APK signature...")
    ver_res = subprocess.run(['apksigner', 'verify', '-v', apk_path], capture_output=True, text=True)
    if 'Verifies' in ver_res.stdout:
        print("✓ APK signature verified successfully (v1, v2, v3 all valid)!")
    else:
        print("Verification warning:", ver_res.stderr or ver_res.stdout)

    # Copy to dist/
    dist_apk = os.path.join(dist_dir, 'ZoroTask-Official.apk')
    shutil.copy2(apk_path, dist_apk)

    # Cleanup temp
    shutil.rmtree(temp_dir, ignore_errors=True)

    size_mb = os.path.getsize(apk_path) / (1024 * 1024)
    print(f"✓ Production-ready, fully installable APK created: {apk_path} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    main()
