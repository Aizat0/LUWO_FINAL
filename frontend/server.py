"""Tiny static server and reverse proxy for local LUWO development."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import argparse
import os


ROOT = Path(__file__).resolve().parent
PROXIES = {
    "/api/auth": "http://127.0.0.1:8001",
    "/api/education": "http://127.0.0.1:8002",
    "/api/assignments": "http://127.0.0.1:8003",
}


class LuwoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        self._dispatch()

    def end_headers(self):
        # Development frontend must always reflect the current source files.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        self._dispatch()

    def do_PUT(self):
        self._dispatch()

    def do_PATCH(self):
        self._dispatch()

    def do_DELETE(self):
        self._dispatch()

    def _dispatch(self):
        for prefix, target in PROXIES.items():
            if self.path == prefix or self.path.startswith(prefix + "/"):
                self._proxy(prefix, target)
                return
        if self.command != "GET":
            self.send_error(405)
            return
        super().do_GET()

    def _proxy(self, prefix, target):
        upstream_path = self.path[len(prefix):] or "/"
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        headers = {
            key: value for key, value in self.headers.items()
            if key.lower() in {"authorization", "content-type", "accept"}
        }
        request = Request(target + upstream_path, data=body, headers=headers, method=self.command)
        try:
            with urlopen(request, timeout=10) as response:
                payload = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except URLError:
            payload = b'{"detail":"Backend service is unavailable"}'
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)


def main():
    parser = argparse.ArgumentParser(description="Run the LUWO frontend")
    parser.add_argument("--port", type=int, default=5173)
    args = parser.parse_args()
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), LuwoHandler)
    print(f"LUWO frontend: http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


if __name__ == "__main__":
    main()
