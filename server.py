"""Serve this project on localhost using only Python's standard library."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser(description='SignalFlow AI local demo')
parser.add_argument('--port', type=int, default=8000)
args = parser.parse_args()
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.json': 'application/json'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
handler = partial(Handler, directory=str(Path(__file__).resolve().parent))
try:
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'SignalFlow AI: http://localhost:{args.port}', flush=True)
        print('Press Ctrl+C to stop.', flush=True)
        server.serve_forever()
except KeyboardInterrupt:
    print('\nServer stopped.')
except OSError as error:
    parser.exit(1, f'Cannot start server: {error}. Try --port 8001.\n')
