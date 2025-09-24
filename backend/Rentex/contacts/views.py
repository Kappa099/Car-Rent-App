from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from .serializers import ContactMessageSerializer

class ContactUsView(APIView):
    def post(self, request):
        data = request.data
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        message = data.get("message")

        if not all([first_name, last_name, email, message]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        subject = f"New Contact Us Message from {first_name} {last_name}"
        body = f"Sender: {first_name} {last_name} <{email}>\n\nMessage:\n{message}"
        recipient = [settings.DEFAULT_FROM_EMAIL] 

        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipient)
            return Response({"message": "Message sent successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
