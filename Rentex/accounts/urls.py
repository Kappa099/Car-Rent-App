from django.urls import path
from .views import RegisterView, LoginView, LogoutView, CurrentUserView, UserProfileView

urlpatterns = [
    path('', LoginView.as_view()), 
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path("profile/", UserProfileView.as_view(), name="my-profile"),
    path("profile/<int:user_id>/", UserProfileView.as_view(), name="user-profile"),

]
