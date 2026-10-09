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
env['AKSCREEN_REQUIRE_GPU_TESTS'] = '1'
steps = [
    ('Formato', ['cargo', 'fmt', '--all', '--', '--check']),
    ('Clippy', ['cargo', 'clippy', '--locked', '--workspace', '--all-targets', '--release', '--', '-D', 'warnings']),
    ('Pruebas del motor', ['cargo', 'test', '--locked', '--workspace', '--release', '--no-fail-fast', '--', '--skip', 'mixer_tests::perf_24_tracks_3_effects_realtime_factor']),
    # Measure the production profile, preserving the original performance assertion.
    ('Rendimiento con optimización de producción', ['cargo', 'test', '--locked', '--release', '-p', 'filmcraft-render', '--lib', 'mixer_tests::perf_24_tracks_3_effects_realtime_factor']),
    ('Arquitectura', ['cargo', 'xtask', 'layers']),
    ('Atribuciones', ['cargo', 'xtask', 'assets']),
    ('Portabilidad WASM', ['cargo', 'xtask', 'wasm']),
]
if os.environ.get('AKSCREEN_CHECK_MODE') == 'compile':
    steps = [steps[0], ('Tipos y destinos', ['cargo','check','--locked','--workspace','--all-targets'])]
phase = os.environ.get('AKSCREEN_CHECK_PHASE', 'all')
mode = os.environ.get('AKSCREEN_CHECK_MODE', 'full')
if mode == 'regressions':
    steps = [steps[0],
        ('Capas', ['cargo','test','--locked','--release','-p','filmcraft-engine','--lib','layers::tests']),
        ('Mate', ['cargo','test','--locked','--release','-p','filmcraft-render','--lib','unmult_removes']),
        ('Audio', ['cargo','test','--locked','--release','-p','filmcraft-audio-dsp','--lib','effects::time::tests']),
        steps[3],
    ]
if phase == 'lint':
    steps = steps[:1] if mode == 'regressions' else steps[:2]
elif phase == 'tests':
    steps = steps[1:] if mode == 'regressions' else steps[2:4]
elif phase == 'rest':
    steps = steps[4:] if mode == 'full' else []
failed = []
with (Path(os.environ['RUNNER_TEMP']) / 'akscreen-build.log').open('wb' if phase in ('all', 'lint') else 'ab') as log:
    for name, command in steps:
        print(f'{name}: en curso', flush=True)
        step_env = env.copy()
        if name == 'Rendimiento con optimización de producción':
            step_env.pop('CARGO_PROFILE_RELEASE_LTO', None)
            step_env.pop('CARGO_PROFILE_RELEASE_CODEGEN_UNITS', None)
        result = subprocess.run(command, cwd='source', env=step_env, stdout=log, stderr=subprocess.STDOUT)
        log.flush()
        if result.returncode:
            print(f'::error::{name} falló. Diagnóstico cifrado para el propietario.', flush=True)
            failed.append(name)
        else:
            print(f'{name}: correcto', flush=True)
if failed:
    sys.exit(1)
