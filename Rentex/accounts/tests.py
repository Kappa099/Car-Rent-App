from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status


User = get_user_model()

class AuthTests(APITestCase):
    def setup(self):
        self.regiser_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        self.user_data = {
            "email" : "test@gmail.com",
            "display_name" : "name",
            "phone" : "599534092",
            "password" : "StrongPassword!",
            # ...
        }

    def test_register_user(self):
        # status codes, database saving logic
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get().phone, "599534092")
        self.assertEqual(User.objects.count(), 1)

    def test_login_user(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            "phone" : "599534092",
            "password" : "StrongPassword!",
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get().phone, "599534092")
        self.assertEqual(User.objects.count(), 1)

    def test_logout_user(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            "phone" : "599534092",
            "password" : "StrongPassword!",
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        response = self.client.post(self.logout_url, )