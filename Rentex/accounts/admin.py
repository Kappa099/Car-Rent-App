from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Notification

class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('phone', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('phone', 'email', 'first_name', 'last_name')
    ordering = ('phone',)
    fieldsets = (
        (None, {'fields': ('phone', 'email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'email', 'first_name', 'last_name', 'password1', 'password2', 'is_staff', 'is_superuser')}
        ),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Notification)
