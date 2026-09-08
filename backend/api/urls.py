from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    TicketViewSet,
    change_password,
    get_it_staff_users,
    get_user_info,
    manage_users,
    remove_user,
    reset_user_password,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet)
router.register(r"tickets", TicketViewSet, basename="ticket")

urlpatterns = [
    path("", include(router.urls)),
    path("user-info/", get_user_info, name="user-info"),
    path("it-staff-users/", get_it_staff_users, name="it-staff-users"),
    path("users/", manage_users, name="manage-users"),
    path("users/<int:user_id>/", remove_user, name="remove-user"),
    path("users/<int:user_id>/reset-password/", reset_user_password, name="reset-user-password"),
    path("change-password/", change_password, name="change-password"),
]
