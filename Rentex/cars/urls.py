from django.urls import include, path
from .views import *


urlpatterns = [
    path('', CarListApiView.as_view(), name='car-list'),
    path('create/', CarListCreateView.as_view(), name='car-create'),
    path('<int:pk>/', CarRetrieveUpdateDestroyAPIView.as_view(), name='car-detail'),
]
