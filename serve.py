"""Local preview server for the portfolio — TWO ports, so the portfolio folder stays tiny.

    python serve.py

    Portfolio (this folder, "Portofolio 2")             -> http://127.0.0.1:5500/index.html
    Project demos (the heavy "Kumpulan" folder beside)  -> http://127.0.0.1:5510/Website/...

The project cards link to the 5510 server (see PORTFOLIO_PROJECT_BASE in index.html), so every
card opens its own site in a NEW TAB on its own origin, while the portfolio keeps its own —
and the portfolio folder never has to contain the multi-gigabyte demo folders.

The 5510 server also de-blocks the CDN stylesheets those demo pages pull from the internet
(Google Fonts, Font Awesome, Bootstrap Icons) before sending them: a slow CDN stylesheet in
<head> is render-blocking, and it makes the tab sit blank white until the request times out.
Files on disk are never modified — only the bytes this server sends. Disable with --no-cdn-fix.

Options:
    --portfolio-port N   portfolio port        (default 5500)
    --projects-port  N   project-demos port    (default 5510)
    --root PATH          parent folder holding both "Portofolio 2" and "Kumpulan"
    --no-open            do not launch a browser
"""
import argparse
import os
import re
import socket
import socketserver
import sys
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_ROOT = os.path.dirname(HERE)
PORTFOLIO_NAME = os.path.basename(HERE)

LINK_TAG = re.compile(r"<link\b[^>]*>", re.I)
REL_STYLESHEET = re.compile(r"rel\s*=\s*[\"']?stylesheet", re.I)
EXT_HREF = re.compile(r"href\s*=\s*[\"']https?://", re.I)
HAS_MEDIA = re.compile(r"\bmedia\s*=", re.I)


def unblock_external_stylesheets(html):
    """Make CDN stylesheets non-render-blocking, in the bytes this server sends only.

    306 of the demo pages link Google Fonts (plus Font Awesome / Bootstrap Icons) from the
    internet inside <head>. A render-blocking stylesheet that is slow or unreachable stops the
    browser from painting ANYTHING: the tab stays blank white until the request finally times
    out. Marking those links media="print" (switched to "all" once loaded) lets the page paint
    straight away, and the webfonts drop in if and when the CDN answers. The files on disk are
    never touched.
    """
    count = 0

    def fix(match):
        nonlocal count
        tag = match.group(0)
        if not REL_STYLESHEET.search(tag) or not EXT_HREF.search(tag) or HAS_MEDIA.search(tag):
            return tag
        count += 1
        return tag[:-1].rstrip() + " media=\"print\" onload=\"this.media='all'\">"

    return LINK_TAG.sub(fix, html), count


class Handler(SimpleHTTPRequestHandler):
    """Static handler: quiet on success, loud on 404, no caching while previewing."""

    def log_message(self, fmt, *args):
        if " 404 " in (fmt % args) or " 500 " in (fmt % args):
            sys.stderr.write("  %s\n" % (fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def guess_type(self, path):
        ctype = super().guess_type(path)
        if ctype in ("text/html", "text/css", "application/javascript", "text/javascript"):
            return ctype + "; charset=utf-8"
        return ctype


def free_port(start, label):
    for port in range(start, start + 40):
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise SystemExit("%s: no free port between %d and %d" % (label, start, start + 39))


class ProjectHandler(Handler):
    """Serves the demo projects; HTML goes out with the CDN stylesheets made non-blocking."""

    def __init__(self, *args, cdn_fix=True, **kwargs):
        self.cdn_fix = cdn_fix
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.cdn_fix and self.path.split("?")[0].lower().endswith((".html", ".htm")):
            path = self.translate_path(self.path)
            if os.path.isfile(path):
                if self.send_rewritten(path):
                    return
        return super().do_GET()

    def do_HEAD(self):
        return super().do_HEAD()

    def send_rewritten(self, path):
        """Send an HTML file with its external stylesheets de-blocked. False -> caller falls back."""
        try:
            with open(path, "rb") as handle:
                text = handle.read().decode("utf-8")
        except (OSError, UnicodeDecodeError):
            return False
        fixed, count = unblock_external_stylesheets(text)
        if not count:
            return False
        body = fixed.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)
        return True


def serve(port, root, handler=Handler):
    # python -m http.server has a 5-deep accept backlog, which drops requests when a browser
    # opens several connections at once (images, fonts, thumbnails).
    socketserver.TCPServer.request_queue_size = 256
    httpd = ThreadingHTTPServer(("127.0.0.1", port), partial(handler, directory=root))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("--portfolio-port", type=int, default=5500)
    ap.add_argument("--projects-port", type=int, default=5510)
    ap.add_argument("--root", default=DEFAULT_ROOT)
    ap.add_argument("--no-open", action="store_true")
    ap.add_argument("--no-cdn-fix", action="store_true",
                    help="serve the demo pages byte-for-byte (a slow CDN then leaves them blank)")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    portfolio_dir = os.path.join(root, PORTFOLIO_NAME)
    projects_dir = os.path.join(root, "Kumpulan")
    if not os.path.isdir(portfolio_dir):
        raise SystemExit("portfolio folder not found: %s" % portfolio_dir)
    if not os.path.isdir(projects_dir):
        raise SystemExit('project folder not found: %s  (move the heavy folders into "Kumpulan")' % projects_dir)

    p_port = free_port(args.portfolio_port, "portfolio")
    j_port = free_port(args.projects_port, "projects")

    serve(p_port, portfolio_dir)
    serve(j_port, projects_dir, ProjectHandler if not args.no_cdn_fix else Handler)

    portfolio_url = "http://127.0.0.1:%d/index.html" % p_port
    print("Portfolio     : %s" % portfolio_url)
    print("  serving     : %s" % portfolio_dir)
    print("Project demos : http://127.0.0.1:%d/Website/..." % j_port)
    print("  serving     : %s" % projects_dir)
    print("  CDN fix     : %s" % ("off (pages served as-is)" if args.no_cdn_fix
                                   else "on (slow Google Fonts can no longer blank the page)"))
    if p_port != args.portfolio_port or j_port != args.projects_port:
        print("  (port busy, bumped to the numbers above; pass --portfolio-port/--projects-port to pin)")
    print("Ctrl+C to stop.")

    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(portfolio_url)).start()
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
