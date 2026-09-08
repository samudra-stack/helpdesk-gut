# pyright: reportIncompatibleMethodOverride=false

from typing import Any

from rest_framework.permissions import BasePermission

from .roles import get_user_role


class DepartmentPermission(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        role = get_user_role(request.user)

        if view.action in ["list", "retrieve"]:
            return True

        return role == "administrator"


class TicketPermission(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        role = get_user_role(request.user)

        if view.action in ["list", "retrieve"]:
            return True

        if view.action == "create":
            return role in ["requester", "administrator"]

        if view.action in ["update", "partial_update"]:
            return role in ["it_staff", "administrator"]

        if view.action == "assign":
            return role in ["it_staff", "administrator"]

        if view.action == "destroy":
            return role == "administrator"

        return False