import os
import sys
import shutil
import zipfile
import base64
import hashlib
import subprocess

def sha256_b64(data: bytes) -> str:
    return base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    apk_path = os.path.join(root_dir, 'public', 'ZoroTask-Official.apk')
    dist_dir = os.path.join(root_dir, 'dist')
    temp_dir = os.path.join(root_dir, '.tmp_apk')

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
            # Skip META-INF signature files and old web assets in assets/public
            if item.filename.startswith('META-INF/'):
                continue
            if item.filename.startswith('assets/public/'):
                continue
            data = z.read(item.filename)
            extracted_files[item.filename] = data

    print(f"Preserved {len(extracted_files)} core Android binary & config files.")

    print("Step 2: Injecting latest compiled React production assets from dist/...")
    new_web_files = {}
    for dirpath, _, filenames in os.walk(dist_dir):
        for fname in filenames:
            # Avoid copying the APK inside itself!
            if fname.endswith('.apk') or fname.endswith('.idsig'):
                continue
            full_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(full_path, dist_dir)
            apk_rel_path = f"assets/public/{rel_path}".replace('\\', '/')
            with open(full_path, 'rb') as f:
                new_web_files[apk_rel_path] = f.read()

    print(f"Added {len(new_web_files)} updated web assets into assets/public/.")

    # Combine all files
    all_files = {}
    all_files.update(extracted_files)
    all_files.update(new_web_files)

    # Make sure assets/capacitor.config.json exists
    if 'assets/capacitor.config.json' not in all_files:
        cap_config = os.path.join(root_dir, 'capacitor.config.json')
        if os.path.exists(cap_config):
            with open(cap_config, 'rb') as f:
                all_files['assets/capacitor.config.json'] = f.read()

    print("Step 3: Generating v1 JAR signature (MANIFEST.MF and CERT.SF)...")
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Created-By: 1.0 (Android Signer)",
        ""
    ]
    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android Signer)",
    ]

    # Calculate digests
    file_digests = {}
    for filename in sorted(all_files.keys()):
        data = all_files[filename]
        digest = sha256_b64(data)
        file_digests[filename] = digest
        manifest_lines.append(f"Name: {filename}")
        manifest_lines.append(f"SHA-256-Digest: {digest}")
        manifest_lines.append("")

    manifest_bytes = "\r\n".join(manifest_lines).encode('utf-8')

    # Manifest digest for CERT.SF
    manifest_digest = sha256_b64(manifest_bytes)
    sf_lines.append(f"SHA-256-Digest-Manifest: {manifest_digest}")
    sf_lines.append("")

    for filename in sorted(all_files.keys()):
        # Individual section digest
        section = f"Name: {filename}\r\nSHA-256-Digest: {file_digests[filename]}\r\n\r\n".encode('utf-8')
        section_digest = sha256_b64(section)
        sf_lines.append(f"Name: {filename}")
        sf_lines.append(f"SHA-256-Digest: {section_digest}")
        sf_lines.append("")

    sf_bytes = "\r\n".join(sf_lines).encode('utf-8')

    print("Step 4: Signing with Android Debug Certificate using OpenSSL...")
    key_path = os.path.join(temp_dir, 'debug.key')
    crt_path = os.path.join(temp_dir, 'debug.crt')
    sf_path = os.path.join(temp_dir, 'CERT.SF')
    rsa_path = os.path.join(temp_dir, 'CERT.RSA')

    subprocess.run([
        'openssl', 'genrsa', '-out', key_path, '2048'
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run([
        'openssl', 'req', '-new', '-x509', '-key', key_path, '-out', crt_path,
        '-days', '10000', '-subj', '/CN=Android Debug/O=Android/C=US'
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(sf_path, 'wb') as f:
        f.write(sf_bytes)

    subprocess.run([
        'openssl', 'smime', '-sign', '-in', sf_path, '-out', rsa_path,
        '-outform', 'DER', '-inkey', key_path, '-signer', crt_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(rsa_path, 'rb') as f:
        rsa_bytes = f.read()

    print("Step 5: Packaging updated signed ZoroTask-Official.apk...")
    new_apk_path = os.path.join(root_dir, 'public', 'ZoroTask-Official.apk')
    
    # Write APK
    with zipfile.ZipFile(new_apk_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for filename in sorted(all_files.keys()):
            zout.writestr(filename, all_files[filename])
        zout.writestr('META-INF/MANIFEST.MF', manifest_bytes)
        zout.writestr('META-INF/CERT.SF', sf_bytes)
        zout.writestr('META-INF/CERT.RSA', rsa_bytes)

    # Step 6: Apply official APK Signature Scheme v2 & v3 with apksigner and debug.keystore
    keystore_path = os.path.join(root_dir, 'scripts', 'debug.keystore')
    if os.path.exists(keystore_path):
        print("Step 6: Signing with apksigner (v1, v2, v3 schemes)...")
        sign_cmd = [
            'apksigner', 'sign',
            '--ks', keystore_path,
            '--ks-pass', 'pass:android',
            '--ks-key-alias', 'androiddebugkey',
            '--key-pass', 'pass:android',
            '--v1-signing-enabled', 'true',
            '--v2-signing-enabled', 'true',
            '--v3-signing-enabled', 'true',
            new_apk_path
        ]
        res = subprocess.run(sign_cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print("✓ APK signed with APK Signature Scheme v2 & v3 successfully!")
        else:
            print(f"Warning: apksigner returned {res.returncode}: {res.stderr}")

    # Also copy into dist/ if dist exists
    dist_apk = os.path.join(dist_dir, 'ZoroTask-Official.apk')
    if os.path.exists(dist_dir):
        shutil.copy2(new_apk_path, dist_apk)

    # Cleanup temp
    shutil.rmtree(temp_dir, ignore_errors=True)

    size_mb = os.path.getsize(new_apk_path) / (1024 * 1024)
    print(f"✓ Successfully built and signed updated ZoroTask-Official.apk ({size_mb:.2f} MB)!")

if __name__ == '__main__':
    main()
