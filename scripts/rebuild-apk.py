import os
import sys
import shutil
import zipfile
import subprocess

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    apk_path = os.path.join(root_dir, 'public', 'ZoroTask-Official.apk')
    dist_dir = os.path.join(root_dir, 'dist')
    temp_dir = os.path.join(root_dir, '.tmp_apk')
    keystore_path = os.path.join(root_dir, 'scripts', 'debug.keystore')

    if not os.path.exists(apk_path):
        print(f"Error: {apk_path} not found.")
        sys.exit(1)

    if not os.path.exists(dist_dir):
        print(f"Error: {dist_dir} not found. Run npm run build first.")
        sys.exit(1)

    print("Step 1: Extracting base Android files from APK...")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    extracted_files = {}
    with zipfile.ZipFile(apk_path, 'r') as z:
        for item in z.infolist():
            # Skip old META-INF signature files and old web assets
            if item.filename.startswith('META-INF/'):
                continue
            if item.filename.startswith('assets/public/'):
                continue
            extracted_files[item.filename] = z.read(item.filename)

    print(f"Preserved {len(extracted_files)} core Android binary & config files.")

    print("Step 2: Injecting latest compiled React production assets from dist/...")
    new_web_files = {}
    for dirpath, _, filenames in os.walk(dist_dir):
        for fname in filenames:
            if fname.endswith('.apk') or fname.endswith('.idsig'):
                continue
            full_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(full_path, dist_dir)
            apk_rel_path = f"assets/public/{rel_path}".replace('\\', '/')
            with open(full_path, 'rb') as f:
                new_web_files[apk_rel_path] = f.read()

    print(f"Added {len(new_web_files)} updated web assets into assets/public/.")

    all_files = {}
    all_files.update(extracted_files)
    all_files.update(new_web_files)

    if 'assets/capacitor.config.json' not in all_files:
        cap_config = os.path.join(root_dir, 'capacitor.config.json')
        if os.path.exists(cap_config):
            with open(cap_config, 'rb') as f:
                all_files['assets/capacitor.config.json'] = f.read()

    print("Step 3: Packaging unaligned APK with uncompressed resources.arsc...")
    unaligned_apk = os.path.join(temp_dir, 'unaligned.apk')
    aligned_apk = os.path.join(temp_dir, 'aligned.apk')

    # Files that MUST be stored uncompressed (ZIP_STORED) for Android runtime mmap
    UNCOMPRESSED_EXTS = ('.so', '.arsc')
    UNCOMPRESSED_NAMES = {'resources.arsc'}

    with zipfile.ZipFile(unaligned_apk, 'w') as zout:
        for filename in sorted(all_files.keys()):
            data = all_files[filename]
            is_uncompressed = (
                filename in UNCOMPRESSED_NAMES or 
                any(filename.endswith(ext) for ext in UNCOMPRESSED_EXTS)
            )
            cmeth = zipfile.ZIP_STORED if is_uncompressed else zipfile.ZIP_DEFLATED
            zout.writestr(filename, data, compress_type=cmeth)

    print("Step 4: Running zipalign 4-byte boundary alignment...")
    res_zipalign = subprocess.run([
        'zipalign', '-p', '-f', '4', unaligned_apk, aligned_apk
    ], capture_output=True, text=True)

    if res_zipalign.returncode != 0:
        print(f"Error running zipalign: {res_zipalign.stderr}")
        sys.exit(1)

    print("Step 5: Signing aligned APK with apksigner (v1, v2, v3 schemes)...")
    sign_cmd = [
        'apksigner', 'sign',
        '--ks', keystore_path,
        '--ks-pass', 'pass:android',
        '--ks-key-alias', 'androiddebugkey',
        '--key-pass', 'pass:android',
        '--v1-signing-enabled', 'true',
        '--v2-signing-enabled', 'true',
        '--v3-signing-enabled', 'true',
        aligned_apk
    ]
    res_sign = subprocess.run(sign_cmd, capture_output=True, text=True)
    if res_sign.returncode != 0:
        print(f"Error running apksigner: {res_sign.stderr}")
        sys.exit(1)

    print("Step 6: Verifying APK integrity and certificates...")
    res_verify = subprocess.run([
        'apksigner', 'verify', '-v', aligned_apk
    ], capture_output=True, text=True)
    if res_verify.returncode != 0:
        print(f"Verification FAILED: {res_verify.stderr} {res_verify.stdout}")
        sys.exit(1)
    print("✓ apksigner verification passed completely!")

    # Replace public APK
    shutil.copy2(aligned_apk, apk_path)
    
    # Also update dist/ copy
    dist_apk = os.path.join(dist_dir, 'ZoroTask-Official.apk')
    if os.path.exists(dist_dir):
        shutil.copy2(aligned_apk, dist_apk)

    # Cleanup temp
    shutil.rmtree(temp_dir, ignore_errors=True)

    size_mb = os.path.getsize(apk_path) / (1024 * 1024)
    print(f"✓ Successfully built, aligned, and signed ZoroTask-Official.apk ({size_mb:.2f} MB)!")

if __name__ == '__main__':
    main()
