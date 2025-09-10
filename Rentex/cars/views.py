from django.shortcuts import render
from django.views import View
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse
from .models import Car, Rental, CarPhoto
from accounts.models import Notification
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RentalSerializer, CarPhotoSerializer, CarSerializer
from rest_framework.generics import GenericAPIView
from rest_framework.generics import ListCreateAPIView


class CarListCreateView(ListCreateAPIView):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# class RentCarView(LoginRequiredMixin, View):  #Later conver this into APIView, too early for now this is Django logic not DRF
#     def post(self, request, car_id):
#         car = get_object_or_404(Car, id=car_id)
#         renter = request.user
#         days = int(request.POST.get('days', 1))
#         total_price = car.price * days

#         rental = Rental.objects.create(
#             user=renter,
#             car=car,
#             days=days,
#             total_price=total_price
#         )

#         Notification.objects.create(
#             user=car.owner,
#             message=f'Your {car.brand} {car.model} has been rented by {renter.first_name} for {days} days.'
#         )

#         return HttpResponse("Car rented successfully!")
    

