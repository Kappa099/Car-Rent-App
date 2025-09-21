from django.db import models
from accounts.models import User
from django.utils import timezone

class Car(models.Model):
    TRANSMISSION_CHOICES = [
        ("automatic", "Automatic"),
        ("manual", "Manual"),
        ("tiptronic", "Tiptronic"),
    ]

    CITY_CHOICES = [
        ("tbilisi", "Tbilisi"),
        ("batumi", "Batumi"),
        ("kutaisi", "Kutaisi"),
        ("rustavi", "Rustavi"),
        ("gori", "Gori"),
        ("zugdidi", "Zugdidi"),
        ("poti", "Poti"),
        ("telavi", "Telavi"),
        ("mestia", "Mestia"),
    ]

    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    price = models.FloatField()
    capacity = models.IntegerField()
    transmission = models.CharField(max_length=50)
    location = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    vehicle_features = models.JSONField(default=list)
    device_connectivity = models.JSONField(default=list)
    convenience = models.JSONField(default=list)
    additional_features = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name="liked_cars", blank=True)

    def __str__(self):
        return f"{self.brand} {self.model} ({self.year})"

    @property
    def likes_count(self):
        return self.likes.count()


class CarPhoto(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="cars/photos/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo of {self.car.brand} {self.car.model}"



class Rental(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rentals')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='rentals')
    pickup_date = models.DateField(default=timezone.now)  # <-- new field
    days = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('returned', 'Returned'), ('cancelled', 'Cancelled')],
        default='active'
    )

    def __str__(self):
        return f'{self.user.username} rented {self.car} for {self.days} days'


class Review(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("car", "user")

    def __str__(self):
        return f"{self.car.brand} {self.car.model} rated {self.rating} by {self.user.username}"
