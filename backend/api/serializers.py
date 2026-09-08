from django.contrib.auth.models import Group, User
from rest_framework import serializers

from .models import Department, Ticket, UserProfile
from .roles import ROLE_ADMINISTRATOR, ROLE_IT_STAFF, ROLE_REQUESTER, get_user_role


class DepartmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True
    )

    class Meta:
        model = Department
        fields = ["id", "name"]

    def validate_name(self, value):
        name = value.strip()
        queryset = Department.objects.filter(name__iexact=name)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("nama department sudah digunakan.")

        return name


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class UserManagementSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "department",
            "department_name",
            "must_change_password",
        ]

    def get_role(self, obj):
        return get_user_role(obj)

    def get_profile(self, obj):
        profile, _ = UserProfile.objects.get_or_create(user=obj)
        return profile

    def get_department(self, obj):
        return self.get_profile(obj).department_id

    def get_department_name(self, obj):
        department = self.get_profile(obj).department
        return department.name if department else ""

    def get_must_change_password(self, obj):
        return self.get_profile(obj).must_change_password


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)
    role = serializers.ChoiceField(
        choices=[ROLE_REQUESTER, ROLE_IT_STAFF, ROLE_ADMINISTRATOR]
    )
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True
    )

    def validate_username(self, value):
        username = value.strip()

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("username sudah digunakan.")

        return username

    def create(self, validated_data):
        role = validated_data["role"]
        department = validated_data["department"]
        user = User(username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()

        if role in [ROLE_IT_STAFF, ROLE_ADMINISTRATOR]:
            group, _ = Group.objects.get_or_create(name=role)
            user.groups.add(group)

        UserProfile.objects.create(
            user=user,
            department=department,
            must_change_password=True
        )

        return user


class AdminResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)
    confirm_password = serializers.CharField(
        required=True,
        allow_blank=False,
        write_only=True
    )

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "konfirmasi password tidak sama."
            })

        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, allow_blank=False, write_only=True)
    new_password = serializers.CharField(required=True, allow_blank=False, write_only=True)
    confirm_password = serializers.CharField(
        required=True,
        allow_blank=False,
        write_only=True
    )

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({
                "old_password": "password lama tidak sesuai."
            })

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "konfirmasi password tidak sama."
            })

        return attrs


def validate_ticket_is_editable(instance):
    if instance and instance.status == "Closed":
        raise serializers.ValidationError({
            "detail": "tiket sudah closed dan tidak bisa diedit."
        })


class TicketSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    assigned_engineers = UserMiniSerializer(
        many=True,
        read_only=True
    )

    assigned_engineer_usernames = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_code",
            "subject",
            "description",
            "department",
            "department_name",
            "priority",
            "status",
            "attachment",
            "handling_note",
            "created_at",
            "created_by",
            "created_by_username",
            "assigned_engineers",
            "assigned_engineer_usernames",
        ]

        read_only_fields = [
            "id",
            "ticket_code",
            "created_at",
            "created_by",
            "created_by_username",
            "department_name",
            "assigned_engineers",
            "assigned_engineer_usernames",
        ]

    def get_assigned_engineer_usernames(self, obj):
        return list(obj.assigned_engineers.values_list("username", flat=True))

    def validate(self, attrs):
        validate_ticket_is_editable(self.instance)

        status = attrs.get("status", getattr(self.instance, "status", None))
        handling_note = attrs.get(
            "handling_note",
            getattr(self.instance, "handling_note", None)
        )

        if status in ["Resolved", "Closed"] and not (handling_note or "").strip():
            raise serializers.ValidationError({
                "handling_note": "catatan penanganan wajib diisi sebelum menyelesaikan tiket."
            })

        return attrs


class TicketStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["status", "handling_note"]

    def validate(self, attrs):
        validate_ticket_is_editable(self.instance)

        status = attrs.get("status", getattr(self.instance, "status", None))
        handling_note = attrs.get(
            "handling_note",
            getattr(self.instance, "handling_note", None)
        )

        if status in ["Resolved", "Closed"] and not (handling_note or "").strip():
            raise serializers.ValidationError({
                "handling_note": "catatan penanganan wajib diisi sebelum menyelesaikan tiket."
            })

        return attrs


class TicketAssignSerializer(serializers.ModelSerializer):
    assigned_engineers = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(groups__name="it_staff"),
        many=True
    )

    class Meta:
        model = Ticket
        fields = ["assigned_engineers"]

    def validate_assigned_engineers(self, value):
        if not value:
            raise serializers.ValidationError("pilih minimal satu engineer.")

        return value

    def update(self, instance, validated_data):
        validate_ticket_is_editable(instance)

        if instance.assigned_engineers.exists():
            raise serializers.ValidationError({
                "detail": "tiket sudah memiliki engineer dan tidak bisa diubah."
            })

        assigned_engineers = validated_data.get("assigned_engineers", [])

        instance.assigned_engineers.set(assigned_engineers)
        instance.status = "Assigned"
        instance.save()

        return instance
