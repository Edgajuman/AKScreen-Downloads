"""Only completed builds, or our own successful four-platform matrix, may publish."""
import json
import os
import re
import subprocess

PLATFORMS = {'windows-x64', 'linux-x64', 'macos-arm64', 'macos-x64'}


def approved(run, jobs=(), own_run=None, required_platforms=None):
    if run.get('path') != '.github/workflows/build.yml':
        return False
    required = PLATFORMS if required_platforms is None else set(required_platforms)
    if required not in (PLATFORMS, {'windows-x64', 'linux-x64'}):
        return False
    builds = [job for job in jobs if job.get('name') in required]
    passed = (len(builds) == len(required) and {j['name'] for j in builds} == required
              and all(j.get('status') == 'completed' and j.get('conclusion') == 'success' for j in builds))
    if own_run is None:
        if required != PLATFORMS:
            # Explicit Windows/Linux release: cancelled/failed optional macOS jobs
            # cannot invalidate already completed, successful required builds.
            return run.get('status') == 'completed' and passed
        return run.get('status') == 'completed' and run.get('conclusion') == 'success'
    if str(run.get('id')) != str(own_run) or run.get('event') != 'workflow_dispatch':
        return False
    return passed


def main():
    repo = os.environ['GITHUB_REPOSITORY']
    run_id = os.environ['BUILD_RUN']
    if not re.fullmatch(r'\d+', run_id):
        raise SystemExit('Invalid build run')
    def get(path):
        return json.loads(subprocess.check_output(['gh', 'api', f'repos/{repo}/actions/runs/{path}']))
    run = get(run_id)
    automatic = os.environ.get('AUTOMATIC') == 'true'
    jobs = get(run_id + '/jobs?per_page=100').get('jobs', [])
    required = PLATFORMS if os.environ.get('INCLUDE_MACOS', 'true') == 'true' else {'windows-x64', 'linux-x64'}
    if not approved(run, jobs, os.environ['GITHUB_RUN_ID'] if automatic else None, required):
        raise SystemExit('Every required platform must pass before publication')
    base = os.environ.get('BASE_BUILD_RUN', '')
    if base and (not re.fullmatch(r'\d+', base) or not approved(get(base))):
        raise SystemExit('A successful base build is required')


if __name__ == '__main__':
    main()
