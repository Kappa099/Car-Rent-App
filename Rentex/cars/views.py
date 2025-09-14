from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Car, Rental, Notification
from .serializers import RentalSerializer, CarSerializer, CarPhotoSerializer, CarPhoto


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class CarListApiView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cars = Car.objects.all()
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)


from .models import Car, CarPhoto
from .serializers import CarSerializer, CarPhotoSerializer

class CarListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        car = serializer.save(owner=request.user)

        image = request.FILES.get("image")
        if image:
            CarPhoto.objects.create(car=car, image=image)

        return Response(CarSerializer(car).data, status=status.HTTP_201_CREATED)


class CarRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_object(self, pk):
        return get_object_or_404(Car, id=pk)

    def get(self, request, pk):
        car = self.get_object(pk)
        serializer = CarSerializer(car)
        return Response(serializer.data)

    def put(self, request, pk):
        car = self.get_object(pk)
        self.check_object_permissions(request, car)
        serializer = CarSerializer(car, data=request.data, partial=True)
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

        try:
            days = int(request.data.get('days', 1))
            if days < 1:
                raise ValueError
        except ValueError:
            return Response({"error": "Minimum day must be 1"}, status=status.HTTP_400_BAD_REQUEST)

        total_price = car.price * days

        serializer = RentalSerializer(data={
            "user": renter.id,
            "car": car.id,
            "days": days,
            "total_price": total_price
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()

        Notification.objects.create(
            user=car.owner,
            message=f'Your {car.brand} {car.model} has been rented by {renter.first_name} for {days} days.'
        )

        if car.owner.email:
            try:
                send_mail(
                    subject="Your car was rented!",
                    message=f"Hello {car.owner.first_name},\n\n"
                            f"Your {car.brand} {car.model} has been rented by {renter.first_name} for {days} days.\n"
                            f"Total price: {total_price}\n\n"
                            "Best regards,\nRentex Team",
                    from_email=None,  
                    recipient_list=[car.owner.email],
                    fail_silently=False,
                )
            except Exception as e:
                print("Email failed:", e)

        return Response({"message": "Car rented successfully!"}, status=status.HTTP_201_CREATED)
