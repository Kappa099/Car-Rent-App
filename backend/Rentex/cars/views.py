from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Car, Rental, CarPhoto, Review
from .serializers import CarSerializer, RentalSerializer, ReviewSerializer, CarFeaturesSerializer
from django.db import models
from django.db.models import Count
from accounts.models import Notification
from datetime import datetime, timedelta, date
from django.core.mail import send_mail
from django.conf import settings


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class CarListApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cars = Car.objects.all()
        city = request.GET.get("city")
        year_min = request.GET.get("year_min")
        year_max = request.GET.get("year_max")
        capacity = request.GET.get("capacity")
        sort = request.GET.get("sort", "default")

        if city:
            cars = cars.filter(location__iexact=city)
        if year_min:
            cars = cars.filter(year__gte=year_min)
        if year_max:
            cars = cars.filter(year__lte=year_max)
        if capacity:
            cars = cars.filter(capacity=capacity)

        if sort == "popular":
            cars = cars.annotate(total_likes=Count("likes")).order_by("-total_likes")
        else:
            cars = cars.order_by("-created_at")

        serializer = CarSerializer(cars, many=True, context={"request": request})
        return Response(serializer.data)

class CarPhotoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def post(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)
        self.check_object_permissions(request, car)

        images = request.FILES.getlist("images")
        if not images:
            return Response({"error": "No images provided"}, status=400)

        photos = []
        for img in images:
            photo = CarPhoto.objects.create(car=car, image=img)
            photos.append(photo.image.url)

        return Response({"photos": photos}, status=201)

class CarListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CarSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        car = serializer.save()
        return Response(CarSerializer(car, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CarRetrieveUpdateDestroyAPIView(APIView):
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwner()]

    def get_object(self, pk):
        return get_object_or_404(Car, id=pk)

    def get(self, request, pk):
        car = self.get_object(pk)
        serializer = CarSerializer(car, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        car = self.get_object(pk)
        self.check_object_permissions(request, car)
        serializer = CarSerializer(car, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        car = self.get_object(pk)
        self.check_object_permissions(request, car)
        car.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)




class RentCarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)
        renter = request.user

        # --- Days validation ---
        try:
            days = int(request.data.get("days", 1))
            if days < 1:
                raise ValueError
        except ValueError:
            return Response({"error": "Minimum rental duration is 1 day"}, status=status.HTTP_400_BAD_REQUEST)

        pickup_date_str = request.data.get("pickup_date")
        try:
            pickup_date = (
                datetime.strptime(pickup_date_str, "%Y-%m-%d").date()
                if pickup_date_str
                else date.today()
            )
        except ValueError:
            return Response({"error": "Invalid pickup_date format. Use YYYY-MM-DD"}, status=400)

        if pickup_date < date.today():
            return Response({"error": "Pickup date cannot be in the past"}, status=400)

        rental_start = pickup_date
        rental_end = pickup_date + timedelta(days=days)

        existing_rentals = Rental.objects.filter(car=car)

        for rental in existing_rentals:
            existing_start = rental.pickup_date
            existing_end = existing_start + timedelta(days=rental.days)

            if rental_start < existing_end and rental_end > existing_start:
                return Response({"error": "Car is not available for the selected dates"}, status=status.HTTP_400_BAD_REQUEST)


        # --- Create rental ---
        total_price = car.price * days
        rental = Rental.objects.create(
            user=renter,
            car=car,
            days=days,
            total_price=total_price,
            pickup_date=pickup_date
        )

        # --- Notification ---
        message = (
            f"{renter.get_full_name()} ({renter.username}) rented your car "
            f"{car.brand} {car.model} for {days} days starting {pickup_date}. "
            f"Total: {total_price}₾"
        )
        Notification.objects.create(user=car.owner, message=message)

        # --- Email owner ---
        if car.owner.email:
            send_mail(
                subject="Your car has been rented 🚗",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[car.owner.email],
                fail_silently=False,
            )

        return Response(
            {"message": "Car rented successfully!", "rental_id": rental.id},
            status=status.HTTP_201_CREATED
        )
    
class LikeCarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)
        user = request.user
        if car.likes.filter(id=user.id).exists():
            car.likes.remove(user)
            return Response({"message": "Car unliked."}, status=status.HTTP_200_OK)
        else:
            car.likes.add(user)
            return Response({"message": "Car liked!"}, status=status.HTTP_200_OK)


class ReviewCarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)
        user = request.user

        rating = request.data.get("rating")
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "Rating must be an integer between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)

        review, created = Review.objects.update_or_create(
            car=car, user=user, defaults={"rating": rating}
        )
        return Response({"message": "Rating submitted", "rating": rating}, status=status.HTTP_200_OK)
    
class UpdateCarFeaturesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, car_id):
        car = get_object_or_404(Car, id=car_id)

        # Only owner can update features
        if car.owner != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CarFeaturesSerializer(car, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
