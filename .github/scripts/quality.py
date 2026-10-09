"""Run full quality gates with owner-encrypted diagnostics."""
import os
from pathlib import Path
import subprocess
import sys

env = os.environ.copy()
env['CARGO_INCREMENTAL'] = '0'
env['CARGO_TERM_COLOR'] = 'never'
# Keep optimized tests without repeating cross-crate LTO for every test executable.
# Production installers retain the source repository's thin-LTO release profile.
env['CARGO_PROFILE_RELEASE_LTO'] = 'off'
env['CARGO_PROFILE_RELEASE_CODEGEN_UNITS'] = '16'
steps = [
    ('Formato', ['cargo', 'fmt', '--all', '--', '--check']),
    ('Clippy', ['cargo', 'clippy', '--locked', '--workspace', '--all-targets', '--release', '--', '-D', 'warnings']),
    ('Pruebas del motor', ['cargo', 'test', '--locked', '--workspace', '--release', '--no-fail-fast']),
    ('Arquitectura', ['cargo', 'xtask', 'layers']),
    ('Atribuciones', ['cargo', 'xtask', 'assets']),
    ('Portabilidad WASM', ['cargo', 'xtask', 'wasm']),
]
with (Path(os.environ['RUNNER_TEMP']) / 'akscreen-build.log').open('wb') as log:
    for name, command in steps:
        print(f'{name}: en curso', flush=True)
        result = subprocess.run(command, cwd='source', env=env, stdout=log, stderr=subprocess.STDOUT)
        log.flush()
        if result.returncode:
            print(f'::error::{name} falló. Diagnóstico cifrado para el propietario.', flush=True)
            sys.exit(result.returncode)
        print(f'{name}: correcto', flush=True)
