ROLE_REQUESTER = "requester"
ROLE_IT_STAFF = "it_staff"
ROLE_ADMINISTRATOR = "administrator"


def get_user_role(user):
    if user.is_superuser or user.groups.filter(name=ROLE_ADMINISTRATOR).exists():
        return ROLE_ADMINISTRATOR

    if user.groups.filter(name=ROLE_IT_STAFF).exists():
        return ROLE_IT_STAFF

    return ROLE_REQUESTER


def is_administrator(user):
    return get_user_role(user) == ROLE_ADMINISTRATOR


def is_it_staff(user):
    return get_user_role(user) == ROLE_IT_STAFF


def is_requester(user):
    return get_user_role(user) == ROLE_REQUESTER