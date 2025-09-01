from django.db import models
from accounts.models import Notification
from cars.models import Rental
from accounts.models import User

class Car(models.Model):
    brand = models.CharField(max_length=20)
    model = models.CharField(max_length=20)
    year = models.DecimalField(max_digits=4, decimal_places=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cars')

    def __str__(self):
        return f'{self.brand} {self.model}'
    
class CarPhoto(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='cars/photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo of {self.car.brand} {self.car.model}"

    

# def rent_car(request, car_id):
#     car = Car.objects.get(id=car_id)
#     renter = request.user
#     days = int(request.POST.get('days', 1))
#     total_price = car.daily_price * days

#     rental = Rental.objects.create(
#         user=renter,
#         car=car,
#         days=days,
#         total_price=total_price
#     )

#     Notification.objects.create(
#         user=car.owner,
#         message=f'Your {car.brand} {car.model} has been rented by {renter.first_name} for {days} days.'
#     )