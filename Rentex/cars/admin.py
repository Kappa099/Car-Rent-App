from django.contrib import admin
from .models import Car, Rental, CarPhoto

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'price', 'available')
    list_filter = ('available', 'color')
    search_fields = ('name', 'color')
    ordering = ('name',)

@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ('car', 'user', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('car__name', 'user__phone')
    ordering = ('-start_date',)

@admin.register(CarPhoto)
class CarPhotoAdmin(admin.ModelAdmin):
    list_display = ('car', 'photo', 'uploaded_at')
    list_filter = ('uploaded_at',)
    ordering = ('-uploaded_at',)
