// Serves what the browser tests need, like a BigBlueButton server would:
//   /playback/presentation/2.3/  the built player (npm run build)
//   /presentation/<id>/          the fixture recordings in e2e/fixtures
//   /playback/translate/         a stand-in LibreTranslate server that
//                                marks each line with its language, e.g.
//                                "[es] مرحبا"
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.E2E_PORT || 4173);
const ROOT = path.resolve(__dirname, '..');
const PLAYER = '/playback/presentation/2.3';
const BUILD = path.join(ROOT, 'build');
const FIXTURES = path.join(__dirname, 'fixtures');

const LANGUAGES = ['ar', 'en', 'es', 'fr'];

const TYPES = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.vtt': 'text/vtt; charset=utf-8',
  '.webm': 'video/webm',
  '.xml': 'application/xml',
};

const sendFile = (request, response, file) => {
  const { size } = fs.statSync(file);
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range || '');

  // Media elements seek with ranges
  if (range) {
    const start = Number(range[1] || 0);
    const end = Math.min(range[2] ? Number(range[2]) : size - 1, size - 1);
    response.writeHead(206, {
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Type': type,
    });
    fs.createReadStream(file, { end, start }).pipe(response);
    return;
  }

  response.writeHead(200, { 'Accept-Ranges': 'bytes', 'Content-Length': size, 'Content-Type': type });
  fs.createReadStream(file).pipe(response);
};

const sendJSON = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
};

const translate = (request, response) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    try {
      const { q, source, target } = JSON.parse(body);
      if (!LANGUAGES.includes(source) || !LANGUAGES.includes(target)) {
        sendJSON(response, 400, { error: 'unsupported language' });
        return;
      }
      const mark = (text) => `[${target}] ${text}`;
      sendJSON(response, 200, { translatedText: Array.isArray(q) ? q.map(mark) : mark(q) });
    } catch (error) {
      sendJSON(response, 400, { error: error.message });
    }
  });
};

// Resolves a request path inside a folder, refusing anything outside it
const inside = (folder, relative) => {
  const file = path.join(folder, decodeURIComponent(relative));

  return file.startsWith(folder + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
};

const server = http.createServer((request, response) => {
  const { pathname } = new URL(request.url, `http://localhost:${PORT}`);

  if (pathname === '/playback/translate/languages') {
    sendJSON(response, 200, LANGUAGES.map(code => ({
      code,
      name: code,
      targets: LANGUAGES.filter(other => other !== code),
    })));
    return;
  }

  if (pathname === '/playback/translate/translate' && request.method === 'POST') {
    translate(request, response);
    return;
  }

  if (pathname.startsWith('/presentation/')) {
    const file = inside(path.join(FIXTURES, 'presentation'), pathname.slice('/presentation/'.length));
    if (file) {
      sendFile(request, response, file);
    } else {
      response.writeHead(404);
      response.end();
    }
    return;
  }

  if (pathname.startsWith(PLAYER)) {
    // Recording links are player routes: they get the player page
    const file = inside(BUILD, pathname.slice(PLAYER.length + 1)) || path.join(BUILD, 'index.html');
    sendFile(request, response, file);
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`e2e server on http://localhost:${PORT}${PLAYER}/`);
});
