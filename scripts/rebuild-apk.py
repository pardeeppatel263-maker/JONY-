import os
import sys
import shutil
import zipfile
import subprocess
import base64
import hashlib

MAIN_ACTIVITY_SMALI = """
.class public Lcom/zorotask/app/MainActivity;
.super Lcom/getcapacitor/BridgeActivity;
.source "MainActivity.java"


# direct methods
.method public constructor <init>()V
    .registers 1

    .line 15
    invoke-direct {p0}, Lcom/getcapacitor/BridgeActivity;-><init>()V

    return-void
.end method

.method static synthetic lambda$onCreate$0(Landroid/view/View;Landroidx/core/view/WindowInsetsCompat;)Landroidx/core/view/WindowInsetsCompat;
    .registers 7
    .param p0, "v"    # Landroid/view/View;
    .param p1, "windowInsets"    # Landroidx/core/view/WindowInsetsCompat;

    .line 37
    invoke-static {}, Landroidx/core/view/WindowInsetsCompat$Type;->systemBars()I

    move-result v0

    invoke-virtual {p1, v0}, Landroidx/core/view/WindowInsetsCompat;->getInsets(I)Landroidx/core/graphics/Insets;

    move-result-object v0

    .line 38
    .local v0, "insets":Landroidx/core/graphics/Insets;
    iget v1, v0, Landroidx/core/graphics/Insets;->left:I

    iget v2, v0, Landroidx/core/graphics/Insets;->top:I

    iget v3, v0, Landroidx/core/graphics/Insets;->right:I

    iget v4, v0, Landroidx/core/graphics/Insets;->bottom:I

    invoke-virtual {p0, v1, v2, v3, v4}, Landroid/view/View;->setPadding(IIII)V

    .line 39
    sget-object v1, Landroidx/core/view/WindowInsetsCompat;->CONSUMED:Landroidx/core/view/WindowInsetsCompat;

    return-object v1
.end method


# virtual methods
.method public onCreate(Landroid/os/Bundle;)V
    .registers 6
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .line 18
    const-string v0, "#1D4ED8"

    invoke-super {p0, p1}, Lcom/getcapacitor/BridgeActivity;->onCreate(Landroid/os/Bundle;)V

    .line 20
    :try_start_5
    invoke-virtual {p0}, Lcom/zorotask/app/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v1

    .line 21
    .local v1, "window":Landroid/view/Window;
    if-eqz v1, :cond_4f

    .line 22
    const/16 v2, 0x200

    invoke-virtual {v1, v2}, Landroid/view/Window;->clearFlags(I)V

    .line 23
    const/high16 v2, -0x80000000

    invoke-virtual {v1, v2}, Landroid/view/Window;->addFlags(I)V

    .line 24
    const/4 v2, 0x0

    invoke-static {v1, v2}, Landroidx/core/view/WindowCompat;->setDecorFitsSystemWindows(Landroid/view/Window;Z)V

    .line 25
    invoke-static {v0}, Landroid/graphics/Color;->parseColor(Ljava/lang/String;)I

    move-result v3

    invoke-virtual {v1, v3}, Landroid/view/Window;->setStatusBarColor(I)V

    .line 26
    const-string v3, "#0F172A"

    invoke-static {v3}, Landroid/graphics/Color;->parseColor(Ljava/lang/String;)I

    move-result v3

    invoke-virtual {v1, v3}, Landroid/view/Window;->setNavigationBarColor(I)V

    .line 28
    const v3, 0x1020002

    invoke-virtual {p0, v3}, Lcom/zorotask/app/MainActivity;->findViewById(I)Landroid/view/View;

    move-result-object v3

    .line 29
    .local v3, "content":Landroid/view/View;
    if-eqz v3, :cond_4f

    .line 30
    invoke-static {v0}, Landroid/graphics/Color;->parseColor(Ljava/lang/String;)I

    move-result v0

    invoke-virtual {v3, v0}, Landroid/view/View;->setBackgroundColor(I)V

    .line 31
    invoke-static {v1, v3}, Landroidx/core/view/WindowCompat;->getInsetsController(Landroid/view/Window;Landroid/view/View;)Landroidx/core/view/WindowInsetsControllerCompat;

    move-result-object v0

    .line 32
    .local v0, "controller":Landroidx/core/view/WindowInsetsControllerCompat;
    if-eqz v0, :cond_45

    .line 33
    invoke-virtual {v0, v2}, Landroidx/core/view/WindowInsetsControllerCompat;->setAppearanceLightStatusBars(Z)V

    .line 34
    invoke-virtual {v0, v2}, Landroidx/core/view/WindowInsetsControllerCompat;->setAppearanceLightNavigationBars(Z)V

    .line 36
    :cond_45
    new-instance v2, Lcom/zorotask/app/MainActivity$$ExternalSyntheticLambda0;

    invoke-direct {v2}, Lcom/zorotask/app/MainActivity$$ExternalSyntheticLambda0;-><init>()V

    invoke-static {v3, v2}, Landroidx/core/view/ViewCompat;->setOnApplyWindowInsetsListener(Landroid/view/View;Landroidx/core/view/OnApplyWindowInsetsListener;)V
    :try_end_4d
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_4d} :catch_4e

    goto :goto_4f

    .line 43
    .end local v0    # "controller":Landroidx/core/view/WindowInsetsControllerCompat;
    .end local v1    # "window":Landroid/view/Window;
    .end local v3    # "content":Landroid/view/View;
    :catch_4e
    move-exception v0

    .line 44
    :cond_4f
    :goto_4f

    .line 46
    :try_start_4f
    invoke-virtual {p0}, Lcom/zorotask/app/MainActivity;->getBridge()Lcom/getcapacitor/Bridge;

    move-result-object v0

    if-eqz v0, :cond_67

    invoke-virtual {v0}, Lcom/getcapacitor/Bridge;->getWebView()Landroid/webkit/WebView;

    move-result-object v1

    if-eqz v1, :cond_67

    new-instance v2, Lcom/zorotask/app/MainActivity$1;

    invoke-direct {v2, p0}, Lcom/zorotask/app/MainActivity$1;-><init>(Lcom/zorotask/app/MainActivity;)V

    const-string v3, "AndroidBridge"

    invoke-virtual {v1, v2, v3}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V
    :try_end_65
    .catch Ljava/lang/Exception; {:try_start_4f .. :try_end_65} :catch_66

    goto :goto_67

    :catch_66
    move-exception v0

    :cond_67
    :goto_67

    return-void
.end method

.method public onBackPressed()V
    .registers 4

    .line 60
    :try_start_0
    invoke-virtual {p0}, Lcom/zorotask/app/MainActivity;->getBridge()Lcom/getcapacitor/Bridge;

    move-result-object v0

    if-eqz v0, :cond_e

    const-string v1, "if(window.__triggerZoroTaskBack){window.__triggerZoroTaskBack();}else{window.history.back();}"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Lcom/getcapacitor/Bridge;->eval(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_c
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_c} :catch_d

    return-void

    :catch_d
    move-exception v0

    :cond_e
    invoke-super {p0}, Lcom/getcapacitor/BridgeActivity;->onBackPressed()V

    return-void
.end method
"""

MAIN_ACTIVITY_LAMBDA_SMALI = """
.class public final synthetic Lcom/zorotask/app/MainActivity$$ExternalSyntheticLambda0;
.super Ljava/lang/Object;
.source "D8$$SyntheticClass"

# interfaces
.implements Landroidx/core/view/OnApplyWindowInsetsListener;


# instance fields
.field public final synthetic f$0:Landroid/view/View;


# direct methods
.method public synthetic constructor <init>(Landroid/view/View;)V
    .registers 2

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/zorotask/app/MainActivity$$ExternalSyntheticLambda0;->f$0:Landroid/view/View;

    return-void
.end method

.method public synthetic constructor <init>()V
    .registers 2

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, 0x0

    iput-object v0, p0, Lcom/zorotask/app/MainActivity$$ExternalSyntheticLambda0;->f$0:Landroid/view/View;

    return-void
.end method


# virtual methods
.method public final onApplyWindowInsets(Landroid/view/View;Landroidx/core/view/WindowInsetsCompat;)Landroidx/core/view/WindowInsetsCompat;
    .registers 4

    invoke-static {p1, p2}, Lcom/zorotask/app/MainActivity;->lambda$onCreate$0(Landroid/view/View;Landroidx/core/view/WindowInsetsCompat;)Landroidx/core/view/WindowInsetsCompat;

    move-result-object v0

    return-object v0
.end method
"""

MAIN_ACTIVITY_BRIDGE_SMALI = """
.class Lcom/zorotask/app/MainActivity$1;
.super Ljava/lang/Object;
.source "MainActivity.java"

# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/zorotask/app/MainActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

# instance fields
.field final synthetic this$0:Lcom/zorotask/app/MainActivity;

# direct methods
.method constructor <init>(Lcom/zorotask/app/MainActivity;)V
    .registers 2
    .param p1, "this$0"    # Lcom/zorotask/app/MainActivity;

    iput-object p1, p0, Lcom/zorotask/app/MainActivity$1;->this$0:Lcom/zorotask/app/MainActivity;
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    return-void
.end method

# virtual methods
.method public exitApp()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2

    iget-object v0, p0, Lcom/zorotask/app/MainActivity$1;->this$0:Lcom/zorotask/app/MainActivity;
    invoke-virtual {v0}, Lcom/zorotask/app/MainActivity;->finishAffinity()V
    return-void
.end method

.method public closeApp()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2

    iget-object v0, p0, Lcom/zorotask/app/MainActivity$1;->this$0:Lcom/zorotask/app/MainActivity;
    invoke-virtual {v0}, Lcom/zorotask/app/MainActivity;->finishAffinity()V
    return-void
.end method
"""

def generate_patched_classes4_dex(temp_dir):
    if not shutil.which('smali'):
        print("Notice: smali not installed, preserving pre-existing compiled classes4.dex from base APK.")
        return None
    smali_dir = os.path.join(temp_dir, 'smali_patched')
    app_dir = os.path.join(smali_dir, 'com', 'zorotask', 'app')
    os.makedirs(app_dir, exist_ok=True)

    with open(os.path.join(app_dir, 'MainActivity.smali'), 'w') as f:
        f.write(MAIN_ACTIVITY_SMALI.strip())
    with open(os.path.join(app_dir, 'MainActivity$1.smali'), 'w') as f:
        f.write(MAIN_ACTIVITY_BRIDGE_SMALI.strip())
    with open(os.path.join(app_dir, 'MainActivity$$ExternalSyntheticLambda0.smali'), 'w') as f:
        f.write(MAIN_ACTIVITY_LAMBDA_SMALI.strip())

    out_dex = os.path.join(temp_dir, 'classes4_native_fixed.dex')
    res = subprocess.run(['smali', 'assemble', smali_dir, '-o', out_dex], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Warning: smali assembly failed: {res.stderr}")
        return None
    return out_dex

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

    print("Step 2b: Injecting native Android onBackPressed override & AndroidBridge into classes4.dex...")
    patched_dex = generate_patched_classes4_dex(temp_dir)
    if patched_dex and os.path.exists(patched_dex):
        with open(patched_dex, 'rb') as f:
            all_files['classes4.dex'] = f.read()
        print("✓ Successfully injected native onBackPressed override into classes4.dex!")
    else:
        print("Warning: could not assemble classes4.dex, using existing DEX.")

    cap_config = os.path.join(root_dir, 'capacitor.config.json')
    if os.path.exists(cap_config):
        with open(cap_config, 'rb') as f:
            all_files['assets/capacitor.config.json'] = f.read()
        print("✓ Injected latest capacitor.config.json with live server URL into APK!")

    print("Step 3: Generating Android JAR (v1) signatures...")
    entries_to_sign = sorted([k for k in all_files.keys() if not k.startswith("META-INF/")])
    manifest_lines = [
        "Manifest-Version: 1.0",
        "Created-By: 1.0 (Android / ZoroTask)",
        "",
    ]
    manifest_entries = {}
    for filename in entries_to_sign:
        data = all_files[filename]
        digest = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
        entry_text = f"Name: {filename}\r\nSHA-256-Digest: {digest}\r\n\r\n"
        manifest_entries[filename] = entry_text
        manifest_lines.append(f"Name: {filename}")
        manifest_lines.append(f"SHA-256-Digest: {digest}")
        manifest_lines.append("")

    manifest_bytes = "\r\n".join(manifest_lines).encode('utf-8')
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')

    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android / ZoroTask)",
        f"SHA-256-Digest-Manifest: {manifest_digest}",
        "",
    ]
    for filename in entries_to_sign:
        entry_bytes = manifest_entries[filename].encode('utf-8')
        entry_digest = base64.b64encode(hashlib.sha256(entry_bytes).digest()).decode('ascii')
        sf_lines.append(f"Name: {filename}")
        sf_lines.append(f"SHA-256-Digest: {entry_digest}")
        sf_lines.append("")

    sf_bytes = "\r\n".join(sf_lines).encode('utf-8')

    sf_path = os.path.join(temp_dir, 'ANDROIDD.SF')
    rsa_path = os.path.join(temp_dir, 'ANDROIDD.RSA')
    pem_path = os.path.join(temp_dir, 'debug.pem')

    with open(sf_path, 'wb') as f:
        f.write(sf_bytes)

    # Extract PEM from debug.keystore and sign ANDROIDD.SF
    subprocess.run([
        'openssl', 'pkcs12', '-in', keystore_path,
        '-passin', 'pass:android', '-nodes', '-out', pem_path
    ], check=True, capture_output=True)

    subprocess.run([
        'openssl', 'smime', '-sign', '-in', sf_path,
        '-out', rsa_path, '-outform', 'DER',
        '-inkey', pem_path, '-signer', pem_path
    ], check=True, capture_output=True)

    with open(rsa_path, 'rb') as f:
        rsa_bytes = f.read()

    all_files['META-INF/MANIFEST.MF'] = manifest_bytes
    all_files['META-INF/ANDROIDD.SF'] = sf_bytes
    all_files['META-INF/ANDROIDD.RSA'] = rsa_bytes

    print("Step 4: Writing 4-byte boundary aligned & signed APK...")
    aligned_apk = os.path.join(temp_dir, 'aligned.apk')

    UNCOMPRESSED_EXTS = ('.so', '.arsc')
    UNCOMPRESSED_NAMES = {'resources.arsc'}

    # Place META-INF files first as standard in JAR/APK
    meta_order = ['META-INF/MANIFEST.MF', 'META-INF/ANDROIDD.SF', 'META-INF/ANDROIDD.RSA']
    other_keys = sorted([k for k in all_files.keys() if k not in meta_order])
    ordered_filenames = meta_order + other_keys

    with open(aligned_apk, 'wb') as f_out:
        with zipfile.ZipFile(f_out, 'w') as zout:
            for filename in ordered_filenames:
                data = all_files[filename]
                is_uncompressed = (
                    filename in UNCOMPRESSED_NAMES or 
                    any(filename.endswith(ext) for ext in UNCOMPRESSED_EXTS)
                )
                cmeth = zipfile.ZIP_STORED if is_uncompressed else zipfile.ZIP_DEFLATED

                zinfo = zipfile.ZipInfo(filename)
                zinfo.compress_type = cmeth

                if is_uncompressed:
                    # Current position before writing local header
                    cur_pos = f_out.tell()
                    # Local file header has fixed 30 bytes + len(filename)
                    fixed_header_len = 30 + len(filename.encode('utf-8'))
                    padding = (4 - ((cur_pos + fixed_header_len) % 4)) % 4
                    zinfo.extra = b'\x00' * padding

                zout.writestr(zinfo, data)

    shutil.copyfile(aligned_apk, apk_path)
    dist_apk = os.path.join(dist_dir, 'ZoroTask-Official.apk')
    shutil.copyfile(aligned_apk, dist_apk)

    size_mb = os.path.getsize(apk_path) / (1024 * 1024)
    print(f"✓ Successfully built, aligned, and signed ZoroTask-Official.apk ({size_mb:.2f} MB)!")
    print(f"✓ Successfully built, aligned, and signed ZoroTask-Official.apk ({size_mb:.2f} MB) with NATIVE onBackPressed back navigation!")

    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

if __name__ == '__main__':
    main()
