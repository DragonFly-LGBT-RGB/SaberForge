#!/usr/bin/env python3
"""Мини-сервер для локального просмотра сайта: python3 start-server.py

Нужен только если браузер плохо открывает index.html напрямую (file://).
Открывает http://localhost:8000 — интернет при этом не требуется.
"""
import http.server
import os
import socketserver
import webbrowser

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):  # тихий лог
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"Saberforge запущен: {url}\nОстановить: Ctrl + C")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        httpd.serve_forever()


if __name__ == "__main__":
    main()
