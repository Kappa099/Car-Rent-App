from rest_framework import serializers
from .models import User, Notification
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required = True, validators = [validate_password])
    confirm_password = serializers.CharField(write_only=True, required = True,)

    class Meta:
        model = User
        fields = ["id", "phone", "email", "first_name", "last_name", "password", "confirm_password"]
        read_only_fields = ["id"]
        extra_kwargs = {
            'phone' : {'required' : True}
        }

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value
    
    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User(
            phone=validated_data["phone"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", "")
        )
        user.set_password(validated_data["password"])
        user.save()
        return user
    
class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    def validate(self, data):
        phone = data.get('phone')
        password = data.get('password')
        user = authenticate(phone = phone, password = password)
        if not user:
            raise serializers.ValidationError("Invalid Phone number or Password")
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    default_error_messages = {
        'bad_token' : "invalid or expired refresh token"
    }

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs
    
    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            self.fail('bad_token')
            
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["id", "created_at"]
