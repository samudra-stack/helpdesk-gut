import uuid

from django.db import IntegrityError, models, transaction
from django.contrib.auth.models import User

class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        related_name='profile',
        on_delete=models.CASCADE
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class Ticket(models.Model):
    # Pilihan Dropdown
    PRIORITY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    )
    STATUS_CHOICES = (
        ('New', 'New'),
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    )

    # Kolom-kolom di database
    ticket_code = models.CharField(max_length=20, unique=True, blank=True)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Low')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    handling_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Relasi User (Siapa yang lapor)
    created_by = models.ForeignKey(User, related_name='created_tickets', on_delete=models.CASCADE)
    
    # Relasi Engineer (Bisa di-assign ke lebih dari 1 orang)
    assigned_engineers = models.ManyToManyField(User, related_name='assigned_tickets', blank=True)

    @staticmethod
    def generate_next_ticket_code():
        max_number = 0

        for code in Ticket.objects.filter(
            ticket_code__startswith="GUT-"
        ).values_list("ticket_code", flat=True):
            suffix = code.replace("GUT-", "", 1)

            if suffix.isdigit():
                max_number = max(max_number, int(suffix))

        return f"GUT-{max_number + 1:05d}"

    # Generate kode tiket berurutan, dengan retry jika terjadi tabrakan unique.
    def save(self, *args, **kwargs):
        if not self.ticket_code:
            for _ in range(100):
                self.ticket_code = self.generate_next_ticket_code()

                try:
                    with transaction.atomic():
                        return super().save(*args, **kwargs)
                except IntegrityError:
                    self.ticket_code = ""

            self.ticket_code = f"GUT-{uuid.uuid4().hex[:8].upper()}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.ticket_code}] {self.subject}"
