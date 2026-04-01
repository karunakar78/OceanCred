#!/usr/bin/env python3
"""
Run backend, web, and mobile apps concurrently from the project root.

Usage:
  python run.py
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
from dataclasses import dataclass
from typing import List


@dataclass
class Service:
    name: str
    command: List[str]
    cwd: str


def ensure_command_available(cmd: str) -> None:
    if shutil.which(cmd) is None:
        print(f"[ERROR] Required command '{cmd}' is not available on PATH.")
        print("Install it and try again.")
        sys.exit(1)


def ensure_python_available() -> None:
    if shutil.which("python") is None and shutil.which("python3") is None:
        print(
            "[ERROR] Required command 'python' or 'python3' is not available on PATH."
        )
        print("Install Python and try again.")
        sys.exit(1)


def start_service(service: Service) -> subprocess.Popen:
    print(f"[STARTING] {service.name}: {' '.join(service.command)} (cwd={service.cwd})")
    return subprocess.Popen(service.command, cwd=service.cwd)


def stop_service(proc: subprocess.Popen, name: str) -> None:
    if proc.poll() is not None:
        return

    print(f"[STOPPING] {name}")
    try:
        if os.name == "nt":
            proc.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            proc.terminate()
    except Exception as exc:  # pragma: no cover
        print(f"[WARN] Failed graceful stop for {name}: {exc}")


def main() -> int:
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root, "backend")
    backend_venv_python = os.path.join(backend_dir, "venv", "bin", "python")

    backend_python = "python"
    if os.path.isfile(backend_venv_python):
        backend_python = backend_venv_python
        print(f"[INFO] Using backend virtual environment: {backend_venv_python}")
    else:
        print("[WARN] backend/venv not found, using system python for backend")

    ensure_python_available()
    ensure_command_available("npm")
    ensure_command_available("npx")

    services = [
        Service("backend", [backend_python, "run.py"], backend_dir),
        Service("web", ["npm", "run", "dev"], os.path.join(root, "web")),
        Service("mobile", ["npx", "expo", "start"], os.path.join(root, "mobile")),
    ]

    procs: List[tuple[Service, subprocess.Popen]] = []

    try:
        for service in services:
            if not os.path.isdir(service.cwd):
                print(f"[ERROR] Missing folder for {service.name}: {service.cwd}")
                return 1
            procs.append((service, start_service(service)))

        print("\nAll services started. Press Ctrl+C to stop all.\n")

        while True:
            for service, proc in procs:
                code = proc.poll()
                if code is not None:
                    print(f"[EXIT] {service.name} exited with code {code}.")
                    return code
    except KeyboardInterrupt:
        print("\n[INFO] Ctrl+C received, stopping all services...")
        return 0
    finally:
        for service, proc in procs:
            stop_service(proc, service.name)

        for service, proc in procs:
            if proc.poll() is None:
                try:
                    proc.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    print(f"[KILL] {service.name}")
                    proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
