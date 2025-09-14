from rest_framework import serializers
from .models import Car, CarPhoto, Rental

class CarPhotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = CarPhoto
        fields = ['car', 'image', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class CarSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    photos = CarPhotoSerializer(many=True, read_only=True)
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Car
        fields = '__all__'

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        car = Car.objects.create(**validated_data)
        for img in images:
            CarPhoto.objects.create(car=car, image=img)
        return car



class RentalSerializer(serializers.ModelSerializer):
    car = CarSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True) 

    class Meta:
        model = Rental
        fields = '__all__'
        read_only_fields = ['created_at']
