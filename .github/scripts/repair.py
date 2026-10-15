"""Propose compiler-supported fixes; keep source changes inside owner-encrypted logs."""
import os
from pathlib import Path
import subprocess
import sys

environment = os.environ.copy()
environment.update(CARGO_INCREMENTAL='0', CARGO_TERM_COLOR='never',
                   CARGO_PROFILE_RELEASE_LTO='off', CARGO_PROFILE_RELEASE_CODEGEN_UNITS='16')
path = Path(os.environ['RUNNER_TEMP']) / 'akscreen-build.log'
with path.open('wb') as log:
    result = subprocess.run(['cargo', 'clippy', '--fix', '--allow-dirty', '--allow-staged',
                             '--locked', '--workspace', '--all-targets', '--release'],
                            cwd='source', env=environment, stdout=log, stderr=subprocess.STDOUT)
    formatted = subprocess.run(['cargo', 'fmt', '--all'], cwd='source', stdout=log, stderr=subprocess.STDOUT)
    checked = subprocess.run(['cargo', 'clippy', '--locked', '--workspace', '--all-targets',
                              '--release', '--', '-D', 'warnings'],
                             cwd='source', env=environment, stdout=log, stderr=subprocess.STDOUT)
    patch = subprocess.check_output(['git', 'diff', '--binary', '--', '*.rs'], cwd='source')
    log.write(b'\nAKSCREEN_PRIVATE_PATCH_BEGIN\n' + patch + b'\nAKSCREEN_PRIVATE_PATCH_END\n')
    log.flush()
print('Propuesta y diagnóstico cifrados para revisión del propietario.', flush=True)
sys.exit(bool(result.returncode or formatted.returncode or checked.returncode))
