#!/usr/bin/env python3
"""Build locally, upload a release over SSH, and atomically publish it."""
import argparse
import hashlib
import json
import pathlib
import posixpath
import re
import shlex
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
REMOTE = r'''
import hashlib, json, os, pathlib, sys, uuid
os.umask(0o022)
base = pathlib.Path(sys.argv[1])
release = sys.argv[2]
operation = sys.argv[3]
if not base.is_absolute() or str(base) == '/' or base.resolve() != base:
    raise SystemExit('Unsafe deployment directory')
base.mkdir(parents=True, exist_ok=True)
current = base / 'current'
previous = base / 'previous'
for link in (current, previous):
    if os.path.lexists(link) and not link.is_symlink():
        raise SystemExit('Refusing to replace a non-symlink: ' + str(link))
staging = base / 'incoming' / release
releases = base / 'releases'
target = releases / release
for directory in (base / 'incoming', releases, staging, target):
    if directory.is_symlink() or directory.resolve() != directory:
        raise SystemExit('Unsafe symlinked deployment storage: ' + str(directory))
if operation == 'prepare':
    if target.exists():
        raise SystemExit('Release already exists')
    staging.mkdir(parents=True, exist_ok=False)
    print('Prepared ' + str(staging))
    raise SystemExit(0)
lock = base / '.publish-lock'
try:
    lock.mkdir()
except FileExistsError:
    raise SystemExit('Another publication is running; check .publish-lock before retrying')
try:
    if operation == 'publish':
        manifest_path = staging / '.deploy-manifest.json'
        manifest = json.loads(manifest_path.read_text())
        actual = set()
        for file in staging.rglob('*'):
            if file.is_symlink():
                raise SystemExit('Symlinks are not allowed in the artifact')
            if file.is_file() and file != manifest_path:
                name = file.relative_to(staging).as_posix()
                actual.add(name)
                if name not in manifest or hashlib.sha256(file.read_bytes()).hexdigest() != manifest[name]:
                    raise SystemExit('Upload verification failed: ' + name)
        if actual != set(manifest) or 'index.html' not in actual or 'index.js' in actual:
            raise SystemExit('Incomplete or non-static upload')
        manifest_path.unlink()
        releases.mkdir(exist_ok=True)
        if target.exists():
            raise SystemExit('Release already exists')
        staging.rename(target)
    elif operation == 'rollback':
        if not target.is_dir() or target.is_symlink() or not (target / 'index.html').is_file():
            raise SystemExit('Not a valid retained release')
    else:
        raise SystemExit('Unknown operation')
    # Both links are replaced by rename, never by unlinking the live link first.
    old = os.readlink(current) if current.is_symlink() else None
    new = os.path.relpath(target, base)
    if old != new:
        if old is not None:
            temporary = base / ('.previous-' + uuid.uuid4().hex)
            temporary.symlink_to(old)
            os.replace(temporary, previous)
        temporary = base / ('.current-' + uuid.uuid4().hex)
        temporary.symlink_to(new)
        os.replace(temporary, current)
    print('Published ' + new + '; previous=' + str(old))
finally:
    lock.rmdir()
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=pathlib.Path, default=pathlib.Path(__file__).with_name('config.json'), help='Deployment JSON configuration (default: deploy/config.json)')
    parser.add_argument('--host', help='Override the configured SSH destination')
    parser.add_argument('--path', help='Override the configured remote directory')
    parser.add_argument('--skip-build', action='store_true', help='Publish the configured artifact without building')
    parser.add_argument('--rollback', metavar='RELEASE', help='Switch to a retained release without building/uploading')
    parser.add_argument('--dry-run', action='store_true', help='Print the workflow without building or connecting')
    args = parser.parse_args()
    try:
        config = json.loads(args.config.read_text())
    except (OSError, ValueError) as error:
        parser.error(f'Cannot read deployment configuration {args.config}: {error}')
    required = {'host', 'path', 'artifact', 'build_commands'}
    if not isinstance(config, dict) or set(config) != required:
        parser.error('Configuration must contain exactly: host, path, artifact, build_commands')
    for key in ('host', 'path', 'artifact'):
        if not isinstance(config[key], str) or not config[key]:
            parser.error(f'Configuration {key} must be a non-empty string')
    commands = config['build_commands']
    if not isinstance(commands, list) or not all(
        isinstance(command, list) and command and all(isinstance(part, str) and part for part in command)
        for command in commands
    ):
        parser.error('build_commands must be a list of non-empty argument lists')
    artifact_path = pathlib.Path(config['artifact'])
    if artifact_path.is_absolute() or '..' in artifact_path.parts or not artifact_path.parts:
        parser.error('artifact must be a non-root directory relative to the project, without ..')
    artifact = ROOT / artifact_path
    if artifact.is_symlink() or not artifact.resolve().is_relative_to(ROOT) or artifact.resolve() == ROOT:
        parser.error('artifact must be a real directory inside the project')
    args.host = args.host if args.host is not None else config['host']
    args.path = args.path if args.path is not None else config['path']
    if not re.fullmatch(r'[A-Za-z0-9_.@-]+', args.host) or args.host.startswith('-'):
        parser.error('Invalid SSH destination')
    if not re.fullmatch(r'/[A-Za-z0-9_./-]+', args.path) or '..' in pathlib.PurePosixPath(args.path).parts or args.path == '/':
        parser.error('Use an absolute, non-root remote path without spaces or ..')
    base = posixpath.normpath('/' + args.path.strip('/'))
    if base == '/':
        parser.error('Remote deployment path cannot be the root directory')
    release = args.rollback if args.rollback is not None else (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8])
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', release):
        parser.error('Invalid release name')

    def run(command, **kwargs):
        print('+ ' + shlex.join(str(part) for part in command), flush=True)
        if not args.dry_run:
            subprocess.run(command, check=True, **kwargs)

    def remote(operation):
        command = shlex.join(['python3', '-', base, release, operation])
        run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', args.host, command], input=REMOTE, text=True)

    if args.rollback is not None:
        remote('rollback')
        return
    if not args.skip_build:
        for command in commands:
            run(command, cwd=ROOT)
    if not args.dry_run and (not (artifact / 'index.html').is_file() or (artifact / 'index.js').exists()):
        parser.error(f'Expected a static {artifact}/index.html and no index.js')
    manifest = {}
    if not args.dry_run:
        for file in sorted(artifact.rglob('*')):
            if file.is_symlink():
                parser.error('Build artifact must not contain symlinks')
            if file.is_file():
                name = file.relative_to(artifact).as_posix()
                if name == '.deploy-manifest.json':
                    parser.error('Reserved deployment manifest filename in artifact directory')
                manifest[name] = hashlib.sha256(file.read_bytes()).hexdigest()
    remote('prepare')
    destination = args.host + ':' + base + '/incoming/' + release + '/'
    options = ['rsync', '-a', '--chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r', '-e', 'ssh -o BatchMode=yes -o ConnectTimeout=15']
    run(options + [str(artifact) + '/', destination])
    with tempfile.TemporaryDirectory(prefix='atomforge-deploy-') as temporary:
        manifest_file = pathlib.Path(temporary) / '.deploy-manifest.json'
        manifest_file.write_text(json.dumps(manifest))
        run(options + [str(manifest_file), destination])
    remote('publish')
    print(('Dry-run complete. Intended Nginx root: ' if args.dry_run else 'Deployment complete. Nginx root: ') + base + '/current')


if __name__ == '__main__':
    main()
