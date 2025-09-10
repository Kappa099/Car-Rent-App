from django.urls import include, path
from .views import *


urlpatterns = [
    path('', CarListApiView.as_view()),
    path('create/', CarListCreateView.as_view()),
    path('cars/<int:pk>', CarRetrieveUpdateDestroyAPIView.as_view())
]