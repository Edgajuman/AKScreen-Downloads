"""Validate binary-only artifacts, publish installers, and update static history."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import urllib.parse

repo = os.environ["GITHUB_REPOSITORY"]
metadata = json.loads(Path("metadata/release.json").read_text(encoding="utf-8"))
version = metadata["version"]
tag = metadata["tag"]
if not re.fullmatch(r"\d+\.\d+\.\d+", version) or tag != "ak-v" + version:
    raise SystemExit("Invalid version")
expected = {"windows-x64", "linux-x64", "macos-arm64", "macos-x64"}
if {p.name.removeprefix("AKScreen-") for p in Path("packages").iterdir()} != expected:
    raise SystemExit("Missing platform packages")
flat = Path("release-assets")
flat.mkdir(exist_ok=True)
assets = []
for platform in sorted(expected):
    folder = Path("packages") / ("AKScreen-" + platform)
    checks = {}
    for line in (folder / "SHA256SUMS.txt").read_text(encoding="utf-8-sig").splitlines():
        digest, name = line.split(None, 1)
        checks[name.lstrip("*")] = digest.lower()
    normalized = []
    for p in sorted(folder.iterdir()):
        if not p.is_file() or p.stat().st_size > 100_000_000:
            raise SystemExit("Unexpected artifact")
        if p.name == "SHA256SUMS.txt":
            continue
        if not p.name.endswith((".exe", ".zip", ".dmg", ".tar.gz")):
            raise SystemExit("Non-binary output refused")
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        if checks.get(p.name) != digest:
            raise SystemExit("Checksum mismatch")
        name = "AKScreen-Windows-x64-Setup.exe" if p.name == "AK Screen Setup.exe" else p.name
        shutil.copy2(p, flat / name)
        normalized.append(f"{digest}  {name}\n")
        if name.endswith((".exe", ".dmg", ".tar.gz")):
            assets.append({"platform": platform, "url": f"https://github.com/{repo}/releases/download/{tag}/{urllib.parse.quote(name)}", "size": p.stat().st_size, "sha256": digest})
    (flat / f"AKScreen-{platform}-SHA256SUMS.txt").write_text("".join(normalized), encoding="utf-8")
Path("release-notes.txt").write_text(metadata["notes"], encoding="utf-8")
paths = [str(p) for p in sorted(flat.iterdir())]
if subprocess.run(["gh", "release", "view", tag, "--repo", repo], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
    subprocess.run(["gh", "release", "upload", tag, *paths, "--repo", repo, "--clobber"], check=True)
    subprocess.run(["gh", "release", "edit", tag, "--repo", repo, "--notes-file", "release-notes.txt"], check=True)
else:
    subprocess.run(["gh", "release", "create", tag, *paths, "--repo", repo, "--target", "main", "--title", f"AK Screen {version}", "--notes-file", "release-notes.txt"], check=True)
metadata.update(url=f"https://github.com/{repo}/releases/tag/{tag}", date=datetime.datetime.now(datetime.timezone.utc).date().isoformat(), assets=assets)
catalogue = json.loads(Path("versions.json").read_text(encoding="utf-8"))
catalogue["releases"] = [metadata] + [r for r in catalogue["releases"] if r["tag"] != tag]
catalogue["releases"].sort(key=lambda r: tuple(map(int, r["version"].split("."))), reverse=True)
Path("versions.json").write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
subprocess.run(["git", "config", "user.name", "AK Screen Releases"], check=True)
subprocess.run(["git", "config", "user.email", "noreply@users.noreply.github.com"], check=True)
subprocess.run(["git", "add", "versions.json"], check=True)
if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode:
    subprocess.run(["git", "commit", "-m", f"Publish AK Screen {version}"], check=True)
    subprocess.run(["git", "push", "origin", "HEAD:main"], check=True)
