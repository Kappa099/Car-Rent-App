from django.urls import path
from .views import *

urlpatterns = [
    path("", CarListApiView.as_view(), name="car-list"),
    path("create/", CarListCreateView.as_view(), name="car-create"),
    path("<int:pk>/", CarRetrieveUpdateDestroyAPIView.as_view(), name="car-detail"),
    path("<int:car_id>/rent/", RentCarView.as_view(), name="car-rent"),
    path("<int:car_id>/like/", LikeCarView.as_view(), name="car-like"),
    path("<int:car_id>/review/", ReviewCarView.as_view(), name="car-review"),
]
