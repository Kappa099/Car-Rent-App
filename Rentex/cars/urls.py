from django.urls import include, path
from .views import *


urlpatterns = [
    path('', CarListCreateView.as_view(), name='car_list_create')
]