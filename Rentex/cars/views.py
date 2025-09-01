from django.shortcuts import render
from django.views import View
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse
from .models import Car, Rental
from accounts.models import Notification


class RentCarView(LoginRequiredMixin, View):
    def post(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)
        renter = request.user
        days = int(request.POST.get('days', 1))
        total_price = car.price * days

        rental = Rental.objects.create(
            user=renter,
            car=car,
            days=days,
            total_price=total_price
        )

        Notification.objects.create(
            user=car.owner,
            message=f'Your {car.brand} {car.model} has been rented by {renter.first_name} for {days} days.'
        )

        return HttpResponse("Car rented successfully!")