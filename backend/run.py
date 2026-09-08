#!/usr/bin/env python
"""
Script untuk menjalankan backend Django Helpdesk dengan mudah.
Menjalankan migrasi dan server secara otomatis.

Cara penggunaan:
    python run.py
    python run.py --port 8080
    python run.py --no-migrate
"""

import os
import sys
import subprocess
import argparse


def find_and_activate_venv():
    """Cari dan aktivasi virtual environment"""
    # Kemungkinan lokasi venv
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_venvs = [
        os.path.join(script_dir, 'venv'),
        os.path.join(script_dir, 'env'),
        os.path.join(script_dir, '.venv'),
        os.path.join(script_dir, '..', 'env'),
        os.path.join(script_dir, '..', 'venv'),
        os.path.join(script_dir, '..', '.venv'),
    ]
    
    for venv_path in possible_venvs:
        venv_path = os.path.normpath(venv_path)
        if os.path.exists(venv_path):
            # Windows: env/Scripts/python.exe
            python_exe = os.path.join(venv_path, 'Scripts', 'python.exe')
            if os.path.exists(python_exe):
                return venv_path, python_exe
            # Linux/Mac: env/bin/python
            python_exe = os.path.join(venv_path, 'bin', 'python')
            if os.path.exists(python_exe):
                return venv_path, python_exe
    
    return None, sys.executable


def main():
    parser = argparse.ArgumentParser(description='Jalankan backend Django Helpdesk')
    parser.add_argument('--host', default='0.0.0.0', help='Host server (default: 0.0.0.0 agar bisa diakses dari IP lokal)')
    parser.add_argument('--port', type=int, default=8000, help='Port server (default: 8000)')
    parser.add_argument('--no-migrate', action='store_true', help='Lewati migrasi database')
    parser.add_argument('--no-makemigrations', action='store_true', help='Lewati makemigrations')
    args = parser.parse_args()

    # Path ke folder backend (tempat manage.py berada)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("=" * 50)
    print("  Django Helpdesk Backend Runner")
    print("=" * 50)
    print()

    # Cari dan gunakan virtual environment
    venv_path, python_exe = find_and_activate_venv()
    
    if venv_path:
        print(f"[OK] Virtual environment: {venv_path}")
        print(f"[OK] Python: {python_exe}")
    else:
        print(f"[INFO] Tidak ada virtual environment, menggunakan: {python_exe}")
        print("[INFO] Jika Django belum terinstall, jalankan: pip install django djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary")

    # Check if manage.py exists
    if not os.path.exists('manage.py'):
        print("[ERROR] File manage.py tidak ditemukan!")
        print("Pastikan Anda menjalankan script ini dari folder backend.")
        sys.exit(1)

    # Check Django installation
    result = subprocess.run(
        [python_exe, '-c', 'import django; print(django.__version__)'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("\n[ERROR] Django tidak terinstall!")
        print("\nUntuk menginstall, jalankan:")
        if venv_path:
            activate_script = os.path.join(venv_path, 'Scripts', 'activate')
            print(f"  1. Aktifkan venv: {activate_script}")
        print("  2. pip install django djangorestframework django-cors-headers djangorestframework-simplejwt psycopg2-binary")
        sys.exit(1)
    
    django_version = result.stdout.strip()
    print(f"[OK] Django version: {django_version}")

    # Run makemigrations
    if not args.no_makemigrations:
        print("\n[1/3] Membuat migrasi...")
        result = subprocess.run(
            [python_exe, 'manage.py', 'makemigrations', '--noinput'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("[OK] Migrasi siap.")
        else:
            # makemigrations bisa saja tidak ada perubahan, itu normal
            if "No changes detected" in result.stdout or "No changes detected" in result.stderr:
                print("[OK] Tidak ada perubahan model.")
            else:
                print(f"[WARNING] {result.stderr}")

    # Run migrate
    if not args.no_migrate:
        print("\n[2/3] Menjalankan migrasi database...")
        result = subprocess.run(
            [python_exe, 'manage.py', 'migrate', '--noinput'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("[OK] Database berhasil di-migrate.")
        else:
            print(f"[ERROR] Migrasi gagal: {result.stderr}")
            print("\nPastikan PostgreSQL sudah berjalan dan database 'helpdesk_db' sudah dibuat.")
            print("Jika belum, jalankan di PostgreSQL:")
            print("  CREATE DATABASE helpdesk_db;")
            sys.exit(1)

    # Run server
    print(f"\n[3/3] Menjalankan server pada {args.host}:{args.port}...")
    print()
    print("=" * 50)
    print(f"  Server lokal: http://127.0.0.1:{args.port}")
    print(f"  Server jaringan: http://192.168.2.6:{args.port}")
    print(f"  Admin panel: http://127.0.0.1:{args.port}/admin")
    print(f"  API endpoint: http://127.0.0.1:{args.port}/api")
    print("=" * 50)
    print("\nTekan CTRL+C untuk menghentikan server.\n")
    
    try:
        subprocess.run(
            [python_exe, 'manage.py', 'runserver', f'{args.host}:{args.port}'],
        )
    except KeyboardInterrupt:
        print("\n\n[INFO] Server dihentikan.")


if __name__ == '__main__':
    main()
