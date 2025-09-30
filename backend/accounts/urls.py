"""
URL patterns for accounts app
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Django's built-in password reset confirm view for email links
    path('password/reset/confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
             template_name='registration/password_reset_confirm.html',
             success_url='/login?reset=success'
         ), 
         name='password_reset_confirm'),
    
    path('email/verify/', views.EmailVerifyView.as_view(), name='email_verify'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Two-Factor Authentication
    path('2fa/setup/', views.TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('2fa/disable/', views.TwoFactorDisableView.as_view(), name='2fa_disable'),
    
    # User Management (Admin only)
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/delete/', views.DeleteUserView.as_view(), name='delete_user'),
    path('users/<int:user_id>/unlock/', views.unlock_user_account, name='unlock_user'),
]