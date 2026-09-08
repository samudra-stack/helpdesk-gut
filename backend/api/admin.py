from django.contrib import admin
from .models import Department, Ticket

# Mendaftarkan tabel Department dengan tampilan standar
admin.site.register(Department)

# Mendaftarkan tabel Ticket dengan tampilan kustom (agar terlihat lebih rapi di tabel admin)
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_code', 'subject', 'department', 'priority', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'priority', 'department')
    search_fields = ('subject', 'ticket_code', 'description')
    readonly_fields = ('ticket_code',) # Agar ID tiket tidak bisa diubah manual