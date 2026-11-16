#!/usr/bin/env python
"""
Buat akun awal untuk 3 role helpdesk, dari environment variable.
Jalankan dari folder backend setelah migrate:

    SEED_ADMIN_PASSWORD='...' SEED_IT_PASSWORD='...' SEED_USER_PASSWORD='...' \
        python seed_users.py

Password TIDAK ditulis di file ini dan TIDAK di-commit. Akun yang
password env-nya tidak diisi akan dilewati. Script ini aman dijalankan
ulang: user yang sudah ada tidak ditimpa passwordnya.
"""
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth.models import Group, User  # noqa: E402

from api.models import UserProfile  # noqa: E402

SPECS = [
    # (env prefix, username default, group, is_superuser)
    ("SEED_ADMIN", "administrator", "administrator", True),
    ("SEED_IT", "it_support", "it_staff", False),
    ("SEED_USER", "user_demo", None, False),
]


def main():
    for prefix, default_username, group_name, is_super in SPECS:
        password = os.environ.get(f"{prefix}_PASSWORD")
        if not password:
            print(f"[skip] {prefix}_PASSWORD belum diisi")
            continue
        username = os.environ.get(f"{prefix}_USERNAME", default_username)
        if User.objects.filter(username=username).exists():
            print(f"[skip] user '{username}' sudah ada, tidak diubah")
            continue
        user = User.objects.create_user(username=username, password=password)
        if is_super:
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["is_staff", "is_superuser"])
        if group_name:
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)
        UserProfile.objects.get_or_create(user=user)
        print(f"[ok] user '{username}' dibuat (group={group_name or 'requester (default)'})")


if __name__ == "__main__":
    main()
