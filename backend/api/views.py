# pyright: reportAttributeAccessIssue=false

from django.contrib.auth.models import User
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Department, Ticket, UserProfile
from .permissions import DepartmentPermission, TicketPermission
from .roles import get_user_role
from .serializers import (
    AdminResetPasswordSerializer,
    ChangePasswordSerializer,
    DepartmentSerializer,
    TicketAssignSerializer,
    TicketSerializer,
    TicketStatusUpdateSerializer,
    UserCreateSerializer,
    UserManagementSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [DepartmentPermission]

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()

        if UserProfile.objects.filter(
            department=department,
            user__is_active=True
        ).exists():
            return Response(
                {"detail": "department masih digunakan oleh user aktif."},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        if Ticket.objects.filter(department=department).exists():
            return Response(
                {"detail": "department masih digunakan oleh tiket."},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        department.delete()
        return Response(status=drf_status.HTTP_204_NO_CONTENT)


class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [TicketPermission]

    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)

        if role in ["administrator", "it_staff"]:
            return Ticket.objects.all().order_by("-created_at")

        return Ticket.objects.filter(created_by=user).order_by("-created_at")

    def get_serializer_class(self):
        role = get_user_role(self.request.user)

        if self.action == "assign":
            return TicketAssignSerializer

        if self.action in ["update", "partial_update"] and role == "it_staff":
            return TicketStatusUpdateSerializer

        return TicketSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            status="New"
        )

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)

        ticket = self.get_object()
        serializer = TicketSerializer(
            ticket,
            context=self.get_serializer_context()
        )

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        super().partial_update(request, *args, **kwargs)

        ticket = self.get_object()
        serializer = TicketSerializer(
            ticket,
            context=self.get_serializer_context()
        )

        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="assign")
    def assign(self, request, pk=None):
        role = get_user_role(request.user)

        if role not in ["it_staff", "administrator"]:
            return Response(
                {"detail": "role ini tidak dapat assign tiket."},
                status=drf_status.HTTP_403_FORBIDDEN
            )

        ticket = self.get_object()

        serializer = TicketAssignSerializer(
            ticket,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        updated_ticket = serializer.save()

        response_serializer = TicketSerializer(
            updated_ticket,
            context=self.get_serializer_context()
        )

        return Response(response_serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    role = get_user_role(request.user)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    department = profile.department

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "role": role,
        "department": department.id if department else None,
        "department_name": department.name if department else "",
        "must_change_password": profile.must_change_password,
        "is_staff": role in ["it_staff", "administrator"],
        "is_superuser": request.user.is_superuser,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_it_staff_users(request):
    role = get_user_role(request.user)

    if role not in ["it_staff", "administrator"]:
        return Response(
            {"detail": "role ini tidak dapat melihat daftar it staff."},
            status=drf_status.HTTP_403_FORBIDDEN
        )

    users = User.objects.filter(
        groups__name="it_staff",
        is_active=True
    ).order_by("username")

    data = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        }
        for user in users
    ]

    return Response(data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_users(request):
    role = get_user_role(request.user)

    if role != "administrator":
        return Response(
            {"detail": "role ini tidak dapat mengelola user."},
            status=drf_status.HTTP_403_FORBIDDEN
        )

    if request.method == "GET":
        users = User.objects.filter(is_active=True).order_by("username")
        serializer = UserManagementSerializer(users, many=True)
        return Response(serializer.data)

    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    response_serializer = UserManagementSerializer(user)

    return Response(
        response_serializer.data,
        status=drf_status.HTTP_201_CREATED
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_user(request, user_id):
    role = get_user_role(request.user)

    if role != "administrator":
        return Response(
            {"detail": "role ini tidak dapat remove user."},
            status=drf_status.HTTP_403_FORBIDDEN
        )

    if request.user.id == user_id:
        return Response(
            {"detail": "akun sendiri tidak dapat di-remove."},
            status=drf_status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return Response(
            {"detail": "user tidak ditemukan."},
            status=drf_status.HTTP_404_NOT_FOUND
        )

    user.is_active = False
    user.save(update_fields=["is_active"])

    return Response(status=drf_status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reset_user_password(request, user_id):
    role = get_user_role(request.user)

    if role != "administrator":
        return Response(
            {"detail": "role ini tidak dapat reset password user."},
            status=drf_status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "user tidak ditemukan."},
            status=drf_status.HTTP_404_NOT_FOUND
        )

    serializer = AdminResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user.set_password(serializer.validated_data["password"])
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.must_change_password = True
    profile.save(update_fields=["must_change_password"])

    response_serializer = UserManagementSerializer(user)

    return Response(response_serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={"request": request}
    )
    serializer.is_valid(raise_exception=True)

    user = request.user
    user.set_password(serializer.validated_data["new_password"])
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.must_change_password = False
    profile.save(update_fields=["must_change_password"])

    role = get_user_role(user)
    department = profile.department

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role,
        "department": department.id if department else None,
        "department_name": department.name if department else "",
        "must_change_password": profile.must_change_password,
        "is_staff": role in ["it_staff", "administrator"],
        "is_superuser": user.is_superuser,
    })
