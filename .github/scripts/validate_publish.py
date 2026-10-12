"""Only completed builds, or our own successful four-platform matrix, may publish."""
import json
import os
import re
import subprocess

PLATFORMS = {'windows-x64', 'linux-x64', 'macos-arm64', 'macos-x64'}


def approved(run, jobs=(), own_run=None):
    if run.get('path') != '.github/workflows/build.yml':
        return False
    if own_run is None:
        return run.get('status') == 'completed' and run.get('conclusion') == 'success'
    if str(run.get('id')) != str(own_run) or run.get('event') != 'workflow_dispatch':
        return False
    builds = [job for job in jobs if job.get('name') in PLATFORMS]
    return (len(builds) == 4 and {j['name'] for j in builds} == PLATFORMS
            and all(j.get('status') == 'completed' and j.get('conclusion') == 'success' for j in builds))


def main():
    repo = os.environ['GITHUB_REPOSITORY']
    run_id = os.environ['BUILD_RUN']
    if not re.fullmatch(r'\d+', run_id):
        raise SystemExit('Invalid build run')
    def get(path):
        return json.loads(subprocess.check_output(['gh', 'api', f'repos/{repo}/actions/runs/{path}']))
    run = get(run_id)
    automatic = os.environ.get('AUTOMATIC') == 'true'
    jobs = get(run_id + '/jobs?per_page=100').get('jobs', []) if automatic else []
    if not approved(run, jobs, os.environ['GITHUB_RUN_ID'] if automatic else None):
        raise SystemExit('Every required platform must pass before publication')
    base = os.environ.get('BASE_BUILD_RUN', '')
    if base and (not re.fullmatch(r'\d+', base) or not approved(get(base))):
        raise SystemExit('A successful base build is required')


if __name__ == '__main__':
    main()
