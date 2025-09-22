from django.urls import path
from .views import ContactUsView

urlpatterns = [
    path("", ContactUsView.as_view(), name="contact-us"),
]
