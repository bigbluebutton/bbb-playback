#!/usr/bin/env python3
"""Gateway between nginx and the caption translation server (LibreTranslate).

The player lets a viewer pick one translated language at a time while it
gets ready: the other translations wait until its first lines are
translated. This gateway applies the same rule on the server, so a viewer
(or a script) cannot keep it busy translating several languages at once:

- While a viewer's language is being prepared (until a first request for it
  succeeds), requests for any other language get 409 with Retry-After.
  Once ready, a language never locks again; picking another one starts a
  new preparation.
- A viewer has at most VIEWER_REQUESTS requests running at once, and one
  address at most ADDRESS_REQUESTS (viewer ids are chosen by the browser),
  otherwise 429 with Retry-After.
- Requests carry at most MAX_LINES lines and MAX_BODY bytes.

Viewers are told apart by the X-Playback-Viewer header the player sends
(one id per browser tab), or by their address. Only the two endpoints the
player uses are served. Python 3.8 or later, standard library only.

Usage: gateway.py [--port 5050] [--upstream http://127.0.0.1:5000]
"""

import argparse
import json
import re
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Until its first lines are translated; a stuck preparation frees the
# viewer after this long
LOCK_TIMEOUT = 90
VIEWER_REQUESTS = 4
ADDRESS_REQUESTS = 16
MAX_LINES = 32
MAX_BODY = 256 * 1024
# Viewers not heard from for this long are forgotten
VIEWER_TTL = 30 * 60
UPSTREAM_TIMEOUT = 120
LANGUAGES_TTL = 300
RETRY_LOCKED = 2
RETRY_BUSY = 1

VIEWER_ID = re.compile(r'^[A-Za-z0-9_-]{8,64}$')


class Viewer:
    def __init__(self):
        self.preparing = None
        self.since = 0.0
        self.ready = set()
        self.running = 0
        self.seen = time.monotonic()


class Locks:
    """Per-viewer language lock and request counts. Thread safe."""

    def __init__(self, lock_timeout=LOCK_TIMEOUT, viewer_requests=VIEWER_REQUESTS,
                 address_requests=ADDRESS_REQUESTS, clock=time.monotonic):
        self.lock_timeout = lock_timeout
        self.viewer_requests = viewer_requests
        self.address_requests = address_requests
        self.clock = clock
        self.viewers = {}
        self.addresses = {}
        self.mutex = threading.Lock()

    def enter(self, viewer_key, address, target):
        """Lets a request in, or says why not: ('locked', language) or
        ('busy', None). Every request let in must be followed by leave()."""
        now = self.clock()
        with self.mutex:
            self._forget(now)
            viewer = self.viewers.setdefault(viewer_key, Viewer())
            viewer.seen = now

            if viewer.preparing and now - viewer.since > self.lock_timeout:
                viewer.preparing = None
            if viewer.preparing and viewer.preparing != target:
                return 'locked', viewer.preparing

            if viewer.running >= self.viewer_requests:
                return 'busy', None
            if self.addresses.get(address, 0) >= self.address_requests:
                return 'busy', None

            if not viewer.preparing and target not in viewer.ready:
                viewer.preparing = target
                viewer.since = now
            viewer.running += 1
            self.addresses[address] = self.addresses.get(address, 0) + 1

            return None, None

    def leave(self, viewer_key, address, target, succeeded):
        with self.mutex:
            viewer = self.viewers.get(viewer_key)
            if viewer:
                viewer.running = max(0, viewer.running - 1)
                viewer.seen = self.clock()
                if succeeded:
                    viewer.ready.add(target)
                if viewer.preparing == target and (succeeded or viewer.running == 0):
                    viewer.preparing = None

            count = self.addresses.get(address, 0) - 1
            if count > 0:
                self.addresses[address] = count
            else:
                self.addresses.pop(address, None)

    def _forget(self, now):
        stale = [key for key, viewer in self.viewers.items()
                 if viewer.running == 0 and now - viewer.seen > VIEWER_TTL]
        for key in stale:
            del self.viewers[key]


class Gateway(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, upstream, locks=None):
        super().__init__(address, Handler)
        self.upstream = upstream.rstrip('/')
        self.locks = locks or Locks()
        self.languages = None
        self.languages_at = 0.0
        self.languages_mutex = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    server_version = 'bbb-playback-translate'
    protocol_version = 'HTTP/1.1'

    def log_message(self, format, *args):  # noqa: A002 - BaseHTTPRequestHandler's name
        pass

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def address(self):
        # nginx, on this host, passes the viewer's address
        forwarded = self.headers.get('X-Real-IP', '').strip()
        return forwarded or self.client_address[0]

    def viewer(self):
        viewer = self.headers.get('X-Playback-Viewer', '').strip()
        if VIEWER_ID.match(viewer):
            return 'viewer:' + viewer

        return 'address:' + self.address()

    def upstream(self, path, body=None):
        request = urllib.request.Request(
            self.server.upstream + path,
            data=body,
            headers={'Content-Type': 'application/json'} if body is not None else {},
            method='POST' if body is not None else 'GET',
        )
        try:
            with urllib.request.urlopen(request, timeout=UPSTREAM_TIMEOUT) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()
        except (urllib.error.URLError, OSError):
            return 502, json.dumps({'error': 'Translation server unavailable'}).encode('utf-8')

    def relay(self, status, body):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802 - BaseHTTPRequestHandler's name
        if self.path.split('?')[0] != '/languages':
            self.send_json(404, {'error': 'Not found'})
            return

        server = self.server
        with server.languages_mutex:
            fresh = server.languages and time.monotonic() - server.languages_at < LANGUAGES_TTL
            if not fresh:
                status, body = self.upstream('/languages')
                if status != 200:
                    self.relay(status, body)
                    return
                server.languages = body
                server.languages_at = time.monotonic()
            body = server.languages
        self.relay(200, body)

    def do_POST(self):  # noqa: N802 - BaseHTTPRequestHandler's name
        if self.path.split('?')[0] != '/translate':
            self.send_json(404, {'error': 'Not found'})
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            length = -1
        if length < 0 or length > MAX_BODY:
            self.send_json(413, {'error': 'Request too large'})
            return

        body = self.rfile.read(length)
        try:
            payload = json.loads(body.decode('utf-8'))
        except (UnicodeDecodeError, ValueError):
            self.send_json(400, {'error': 'Invalid JSON'})
            return

        target = payload.get('target') if isinstance(payload, dict) else None
        lines = payload.get('q') if isinstance(payload, dict) else None
        if not isinstance(target, str) or not target or not isinstance(lines, (str, list)):
            self.send_json(400, {'error': 'Invalid request'})
            return
        if isinstance(lines, list) and len(lines) > MAX_LINES:
            self.send_json(413, {'error': 'Too many lines'})
            return

        viewer = self.viewer()
        address = self.address()
        refused, preparing = self.server.locks.enter(viewer, address, target)
        if refused == 'locked':
            self.send_json(409, {
                'error': 'Another language is being prepared',
                'preparing': preparing,
            }, {'Retry-After': str(RETRY_LOCKED)})
            return
        if refused == 'busy':
            self.send_json(429, {'error': 'Too many requests'}, {'Retry-After': str(RETRY_BUSY)})
            return

        succeeded = False
        try:
            status, response = self.upstream('/translate', body)
            succeeded = status == 200
            self.relay(status, response)
        finally:
            self.server.locks.leave(viewer, address, target, succeeded)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5050)
    parser.add_argument('--upstream', default='http://127.0.0.1:5000')
    args = parser.parse_args()

    server = Gateway((args.host, args.port), args.upstream)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
