"""Build private sources without exposing compiler output or source caches."""
import json
import os
import re
from pathlib import Path
import subprocess
import sys

root = Path("source").resolve()
log = Path(os.environ["RUNNER_TEMP"]) / "akscreen-build.log"
target = os.environ["AKSCREEN_TARGET"]
platform = os.environ["AKSCREEN_PLATFORM"]
env = os.environ.copy()
env["CARGO_INCREMENTAL"] = "0"
env["CARGO_TERM_COLOR"] = "never"
if platform == "windows":
    env["CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_RUSTFLAGS"] = "-C target-feature=+crt-static"
    env["FILMCRAFT_REQUIRE_WINRES"] = "1"

steps = [
    ("Formato", ["cargo", "fmt", "--all", "--", "--check"]),
    ("Compilación", ["cargo", "build", "--release", "--locked", "-p", "filmcraft", "--bin", "AKScreen", "--target", target]),
    ("Temas", ["cargo", "test", "--release", "--locked", "-p", "filmcraft-ui-egui", "--lib", "--target", target, "theme::tests::akscreen_themes"]),
    ("Grabación y edición", ["cargo", "test", "--release", "--locked", "-p", "filmcraft", "--bin", "AKScreen", "--target", target, "akscreen::"]),
    ("Arquitectura", ["cargo", "xtask", "layers"]),
    ("Atribuciones", ["cargo", "xtask", "assets"]),
]
if platform == "windows":
    steps.append(("Instalaciones de Windows", ["cargo", "test", "--release", "--locked", "-p", "filmcraft-platform", "--lib", "--target", target, "installations::tests"]))
    steps.append(("Instalador", ["pwsh", "-NoProfile", "-File", "packaging/akscreen/windows.ps1", "-Target", target]))
else:
    steps.append(("Paquete", ["bash", f"packaging/akscreen/{platform}.sh", target]))
base_revision = None
with log.open("wb") as output:
    if os.environ.get("AKSCREEN_NATIVE_PATCH") == "true":
        base_revision = json.loads(Path("base-metadata/release.json").read_text(encoding="utf-8"))["sourceRevision"]
        if platform != "windows" or not re.fullmatch(r"[0-9a-f]{40}", base_revision):
            raise SystemExit("Invalid native amendment")
        diff = subprocess.run(["git", "diff", "--name-only", base_revision, "HEAD"], cwd=root, stdout=subprocess.PIPE, stderr=output, check=True)
        if diff.stdout.decode().splitlines() != ["crates/platform/src/installations.rs"]:
            raise SystemExit("This amendment must leave all shared and non-Windows source unchanged")
    for name, command in steps:
        print(f"{name}: en curso", flush=True)
        result = subprocess.run(command, cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT)
        output.flush()
        if result.returncode:
            print(f"::error::{name} falló. El diagnóstico está cifrado para el propietario.", flush=True)
            sys.exit(result.returncode)
        print(f"{name}: correcto", flush=True)
metadata = json.loads((root / "packaging/akscreen/release.json").read_text(encoding="utf-8"))
metadata["sourceRevision"] = os.environ["AKSCREEN_SOURCE_SHA"]
if base_revision:
    metadata["baseSourceRevision"] = base_revision
Path("metadata").mkdir(exist_ok=True)
Path("metadata/release.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
