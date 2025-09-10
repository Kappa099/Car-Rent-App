from rest_framework import serializers
from .models import Car, CarPhoto, Rental

class CarSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['owner']
    
class CarPhotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = CarPhoto
        fields = ['car', 'image', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class RentalSerializer(serializers.ModelSerializer):
    car = CarSerializer(read_only=True)

    class Meta:
        model = Rental
        fields = '__all__'
        read_only_fields = ['created_at']

