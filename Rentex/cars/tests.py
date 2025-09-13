from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Car, Rental, Notification

User = get_user_model()

class CarRentalTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            phone="599123456",
            email="owner@test.com",
            password="OwnerPass123!",
            first_name="Owner",
            last_name="User"
        )
        self.renter = User.objects.create_user(
            phone="599654321",
            email="renter@test.com",
            password="RenterPass123!",
            first_name="Renter",
            last_name="User"
        )

        self.car = Car.objects.create(
            brand="Toyota",
            model="Corolla",
            year=2020,
            price=50,
            owner=self.owner
        )

        # URLs
        self.car_list_url = reverse("car-list-create")  
        self.car_detail_url = reverse("car-detail", args=[self.car.id])
        self.rent_car_url = reverse("rent-car", args=[self.car.id])

    def authenticate(self, user):
        """Helper to login and set JWT in headers."""
        login_url = reverse("login")
        resp = self.client.post(login_url, {"phone": user.phone, "password": "OwnerPass123!" if user == self.owner else "RenterPass123!"}, format="json")
        token = resp.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_list_cars(self):
        response = self.client.get(self.car_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Car.objects.count())

    def test_create_car_authenticated(self):
        self.authenticate(self.owner)
        data = {"brand": "BMW", "model": "X5", "year": 2022, "price": 100}
        response = self.client.post(self.car_list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Car.objects.count(), 2)
        self.assertEqual(Car.objects.last().owner, self.owner)

    def test_retrieve_car(self):
        self.authenticate(self.owner)
        response = self.client.get(self.car_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand"], "Toyota")

    def test_update_car_only_by_owner(self):
        self.authenticate(self.renter) 
        response = self.client.put(self.car_detail_url, {"brand": "Honda"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.owner) 
        response = self.client.put(self.car_detail_url, {"brand": "Honda"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["brand"], "Honda")

    def test_delete_car_only_by_owner(self):
        self.authenticate(self.renter)
        response = self.client.delete(self.car_detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.owner)
        response = self.client.delete(self.car_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Car.objects.count(), 0)

    def test_rent_car_creates_rental_and_notification(self):
        self.authenticate(self.renter)
        response = self.client.post(self.rent_car_url, {"days": 3}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rental.objects.count(), 1)
        self.assertEqual(Notification.objects.count(), 1)
        rental = Rental.objects.first()
        self.assertEqual(rental.user, self.renter)
        self.assertEqual(rental.car, self.car)
        self.assertEqual(rental.days, 3)
