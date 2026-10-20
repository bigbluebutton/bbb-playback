"""Tests for the translation gateway: python3 -m unittest discover -s translate"""

import json
import threading
import time
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from gateway import Gateway, Locks


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


class LocksTest(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.locks = Locks(lock_timeout=90, viewer_requests=2, address_requests=3, clock=self.clock)

    def test_other_languages_wait_while_one_gets_ready(self):
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), (None, None))
        self.assertEqual(self.locks.enter('a', 'ip', 'fr'), ('locked', 'es'))
        # The same language may run several requests
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), (None, None))

    def test_a_ready_language_frees_the_viewer(self):
        self.locks.enter('a', 'ip', 'es')
        self.locks.leave('a', 'ip', 'es', succeeded=True)

        self.assertEqual(self.locks.enter('a', 'ip', 'fr'), (None, None))
        # Back to Spanish while French gets ready: French holds the lock
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), ('locked', 'fr'))
        self.locks.leave('a', 'ip', 'fr', succeeded=True)
        # Both ready: switching is free
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), (None, None))
        self.assertEqual(self.locks.enter('a', 'ip', 'fr'), (None, None))

    def test_a_failed_preparation_frees_the_viewer(self):
        self.locks.enter('a', 'ip', 'es')
        self.locks.leave('a', 'ip', 'es', succeeded=False)

        self.assertEqual(self.locks.enter('a', 'ip', 'fr'), (None, None))

    def test_a_stuck_preparation_frees_the_viewer_in_time(self):
        self.locks.enter('a', 'ip', 'es')
        self.clock.now += 91

        self.assertEqual(self.locks.enter('a', 'ip', 'fr'), (None, None))

    def test_viewers_do_not_lock_each_other(self):
        self.locks.enter('a', 'ip', 'es')

        self.assertEqual(self.locks.enter('b', 'ip', 'fr'), (None, None))

    def test_requests_at_once_are_limited_per_viewer_and_address(self):
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), (None, None))
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), (None, None))
        self.assertEqual(self.locks.enter('a', 'ip', 'es'), ('busy', None))
        # Another viewer id from the same address
        self.assertEqual(self.locks.enter('b', 'ip', 'fr'), (None, None))
        self.assertEqual(self.locks.enter('c', 'ip', 'de'), ('busy', None))

        self.locks.leave('a', 'ip', 'es', succeeded=True)
        self.assertEqual(self.locks.enter('c', 'ip', 'de'), (None, None))


class Upstream(BaseHTTPRequestHandler):
    """Stand-in LibreTranslate: marks each line with its language. Lines for
    `slow` take a second, lines for `broken` fail"""

    protocol_version = 'HTTP/1.1'

    def log_message(self, format, *args):  # noqa: A002
        pass

    def reply(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        self.reply(200, [{'code': 'ar', 'targets': ['en', 'es', 'fr']}])

    def do_POST(self):  # noqa: N802
        payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        target = payload['target']
        if target == 'broken':
            self.reply(500, {'error': 'down'})
            return
        if target == 'slow':
            time.sleep(1)
        lines = payload['q'] if isinstance(payload['q'], list) else [payload['q']]
        self.reply(200, {'translatedText': ['[%s] %s' % (target, line) for line in lines]})


class GatewayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.upstream = ThreadingHTTPServer(('127.0.0.1', 0), Upstream)
        cls.upstream.daemon_threads = True
        threading.Thread(target=cls.upstream.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.upstream.shutdown()
        cls.upstream.server_close()

    def setUp(self):
        upstream = 'http://127.0.0.1:%d' % self.upstream.server_address[1]
        self.gateway = Gateway(('127.0.0.1', 0), upstream)
        threading.Thread(target=self.gateway.serve_forever, daemon=True).start()
        self.base = 'http://127.0.0.1:%d' % self.gateway.server_address[1]

    def tearDown(self):
        self.gateway.shutdown()
        self.gateway.server_close()

    def post(self, target, viewer='viewer-0001', lines=None, path='/translate'):
        body = json.dumps({'q': lines or ['مرحبا'], 'source': 'ar', 'target': target}).encode('utf-8')
        headers = {'Content-Type': 'application/json'}
        if viewer:
            headers['X-Playback-Viewer'] = viewer
        request = urllib.request.Request(self.base + path, data=body, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return response.status, json.loads(response.read()), response.headers
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read()), error.headers

    def test_translates_through_the_server(self):
        status, payload, _ = self.post('es')

        self.assertEqual(status, 200)
        self.assertEqual(payload, {'translatedText': ['[es] مرحبا']})

    def test_lists_the_languages(self):
        with urllib.request.urlopen(self.base + '/languages', timeout=10) as response:
            self.assertEqual(json.loads(response.read())[0]['code'], 'ar')

    def test_another_language_waits_while_one_gets_ready(self):
        results = {}
        slow = threading.Thread(target=lambda: results.update(slow=self.post('slow')))
        slow.start()
        time.sleep(0.3)

        status, payload, headers = self.post('fr')
        self.assertEqual(status, 409)
        self.assertEqual(payload['preparing'], 'slow')
        self.assertEqual(headers['Retry-After'], '2')

        # Another viewer is not held up
        self.assertEqual(self.post('fr', viewer='viewer-0002')[0], 200)

        slow.join()
        self.assertEqual(results['slow'][0], 200)
        # Ready: any language again
        self.assertEqual(self.post('fr')[0], 200)

    def test_a_failure_frees_the_viewer(self):
        self.assertEqual(self.post('broken')[0], 500)
        self.assertEqual(self.post('es')[0], 200)

    def test_rejects_oversized_and_malformed_requests(self):
        self.assertEqual(self.post('es', lines=['x'] * 33)[0], 413)

        request = urllib.request.Request(self.base + '/translate', data=b'not json',
                                         headers={'Content-Type': 'application/json'}, method='POST')
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request, timeout=10)
        self.assertEqual(caught.exception.code, 400)

    def test_serves_only_the_player_endpoints(self):
        self.assertEqual(self.post('es', path='/detect')[0], 404)


if __name__ == '__main__':
    unittest.main()
