from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class AuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        self.user_data = {
            "email": "test@gmail.com",
            "first_name": "Vako",
            "last_name": "Kapanadze",
            "username": "599534092",  # now using username instead of phone
            "password": "StrongPassword!",
            "confirm_password": "StrongPassword!"
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, "599534092")

    def test_login_user(self):
        # Register first
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            "username": "599534092",  # login uses username
            "password": "StrongPassword!"
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_logout_user(self):
        # Register
        self.client.post(self.register_url, self.user_data, format='json')
        # Login
        login_data = {
            "username": "599534092",
            "password": "StrongPassword!"
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']

        # Logout
        response = self.client.post(self.logout_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'logged out successfully')
