from rest_framework import serializers
from .models import Car, CarPhoto, Rental

class CarSerializer(serializers.ModelSerializer):
    confirm_price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['owner']

    def validate(self, data):
        if 'confirm_price' in data and data['price'] != data['confirm_price']:
            raise serializers.ValidationError('Price does not match')
        data.pop('confirm_price', None) # I added this part due to error since confirm_price does not exist in models 
        return data

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

