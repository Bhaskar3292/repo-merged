"""
Views for user authentication and management
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.utils import timezone
from django.conf import settings
import logging
import qrcode
import io
import base64
from .utils import get_client_ip, log_security_event
from .models import User
from permissions.decorators import require_permission
from permissions.models import check_user_permission
from .serializers import (
    UserSerializer, LoginSerializer, CreateUserSerializer, UserListSerializer,
    PasswordChangeSerializer, TwoFactorSetupSerializer,
    TwoFactorVerifySerializer
)
from .permissions import IsAdminUser

logger = logging.getLogger(__name__)

class LoginRateThrottle(UserRateThrottle):
    scope = 'login'


class LoginView(generics.GenericAPIView):
    """
    User login endpoint
    """
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            
            # Reset failed login attempts on successful login
            user.reset_failed_login()
            user.last_login_ip = ip_address
            user.save(update_fields=['last_login_ip'])
            
            # Log successful login
            log_security_event(
                user=user,
                action='login',
                description=f'Successful login from {ip_address}',
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
            
        except Exception as e:
            # Try to get user for failed login tracking
            email = request.data.get('email')
            if email:
                try:
                    user = User.objects.get(email=email)
                    if not user.is_account_locked():
                        user.increment_failed_login()
                    
                    # Log failed login
                    log_security_event(
                        user=user,
                        action='login_failed',
                        description=f'Failed login attempt from {ip_address}: {str(e)}',
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                except User.DoesNotExist:
                    # Log failed login for non-existent user
                    log_security_event(
                        user=None,
                        action='login_failed',
                        description=f'Failed login attempt for non-existent email {email} from {ip_address}',
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
            
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(generics.GenericAPIView):
    """
    User logout endpoint
    """
    permission_classes = [permissions.AllowAny]  # Allow both authenticated and unauthenticated users
    
    def post(self, request):
        try:
            # Get refresh token from request
            refresh_token = request.data.get('refresh_token') or request.data.get('refresh')
            
            if refresh_token:
                try:
                    # Validate and blacklist the refresh token
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError as e:
                    # Don't fail logout if token is already invalid/expired
                    pass
                except Exception as e:
                    # Don't fail logout for token issues
                    pass
            
            # Log logout event (only if user is authenticated)
            if request.user and request.user.is_authenticated:
                log_security_event(
                    user=request.user,
                    action='logout',
                    description=f'User logged out',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            
            return Response({
                'message': 'Logout successful',
                'status': 'success'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Always return success for logout to prevent client-side issues
            return Response({
                'message': 'Logout completed',
                'status': 'success'
            }, status=status.HTTP_200_OK)


class PasswordChangeView(generics.GenericAPIView):
    """
    Password change endpoint
    """
    serializer_class = PasswordChangeSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.last_password_change = timezone.now()
        user.force_password_change = False
        user.save()
        
        # Log password change
        log_security_event(
            user=user,
            action='password_change',
            description='Password changed by user',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': 'Password changed successfully'})


class PasswordResetView(generics.GenericAPIView):
    """
    Password reset request endpoint
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email address is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Always return success message for security (don't reveal if email exists)
        success_message = 'If an account with this email exists, password reset instructions have been sent.'
        
        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Ensure uidb64 is never empty
            if not uidb64:
                return Response({'message': success_message}, status=status.HTTP_200_OK)
            
            # Build frontend reset URL
            protocol = 'https' if request.is_secure() else 'http'
            frontend_host = request.get_host().replace(':8000', ':5173')
            reset_url = f"{protocol}://{frontend_host}/reset-password/{uidb64}/{token}/"
            
            context = {
                'user': user,
                'reset_url': reset_url,
            }
            
            # Render email templates
            subject = render_to_string('registration/password_reset_subject.txt', context).strip()
            html_message = render_to_string('registration/password_reset_email.html', context)
            text_message = render_to_string('registration/password_reset_email.txt', context)
            
            # Send email (in development, this will print to console)
            send_mail(
                subject=subject,
                message=text_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            
            # Log password reset request
            log_security_event(
                user=user,
                action='password_reset',
                description=f'Password reset requested for {email}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'reset_url': reset_url}
            )
            
        except User.DoesNotExist:
            # Don't reveal whether the email exists or not for security
            pass
        
        return Response({'message': success_message}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    Password reset confirmation endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        uidb64 = request.data.get('uidb64') or request.data.get('uid')
        token = request.data.get('token') 
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')
        
        if not all([uidb64, token, password, password_confirm]):
            return Response(
                {'error': 'UID, token, password, and password confirmation are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != password_confirm:
            return Response(
                {'error': 'Passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode the user ID
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            
            # Validate the token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Invalid or expired reset token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate password
            try:
                validate_password(password, user)
            except DjangoValidationError as e:
                return Response(
                    {'error': list(e.messages)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(password)
            user.last_password_change = timezone.now()
            user.force_password_change = False
            user.save()
            
            # Log password reset completion
            log_security_event(
                user=user,
                action='password_reset',
                description=f'Password reset completed for {user.email}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'reset_method': 'email_link'}
            )
            
            return Response({
                'message': 'Password has been reset successfully. You can now log in with your new password.'
            })
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerifyView(generics.GenericAPIView):
    """
    Email verification endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Verification token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In a real implementation, you would validate the token here
        # For now, we'll just return a success message
        return Response({
            'message': 'Email address has been verified successfully.'
        })


class TwoFactorSetupView(generics.GenericAPIView):
    """
    2FA setup endpoint
    """
    def get(self, request):
        user = request.user
        secret = user.generate_totp_secret()
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(user.get_totp_uri())
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_code}',
            'backup_codes': user.generate_backup_codes()
        })
    
    def post(self, request):
        serializer = TwoFactorSetupSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.two_factor_enabled = True
        user.save(update_fields=['two_factor_enabled'])
        
        # Log 2FA enablement
        log_security_event(
            user=user,
            action='2fa_enabled',
            description='Two-factor authentication enabled',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': '2FA enabled successfully'})


class TwoFactorDisableView(generics.GenericAPIView):
    """
    2FA disable endpoint
    """
    def post(self, request):
        user = request.user
        user.two_factor_enabled = False
        user.totp_secret = ''
        user.backup_codes = []
        user.save(update_fields=['two_factor_enabled', 'totp_secret', 'backup_codes'])
        
        # Log 2FA disablement
        log_security_event(
            user=user,
            action='2fa_disabled',
            description='Two-factor authentication disabled',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': '2FA disabled successfully'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile endpoint
    """
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class CreateUserView(generics.CreateAPIView):
    """
    Create new user endpoint (admin only)
    """
    serializer_class = CreateUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('add_user')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log user creation
        log_security_event(
            user=request.user,
            action='user_created',
            description=f'Created user: {user.username} with role: {user.role}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'created_user_id': user.id, 'created_user_role': user.role}
        )
        
        return Response({
            'message': 'User created successfully',
            'user': UserListSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    


class UserListView(generics.ListAPIView):
    """
    List all users endpoint (admin only)
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @require_permission('view_users')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        # CRITICAL FIX: Use the correct User model and ensure proper queryset
        queryset = User.objects.all().order_by('-created_at')
        return queryset
    
    def list(self, request, *args, **kwargs):
        # Simplified permission check
        user = request.user
        
        # Check if user has admin permissions
        if not (user.is_superuser or user.role == 'admin'):
            return Response(
                {'error': 'Only administrators can view user list'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    User detail endpoint (admin only)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    
    @require_permission('view_users')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @require_permission('edit_user')
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @require_permission('delete_user')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
    
    def get_queryset(self):
        # Check if user has permission to view users
        if not check_user_permission(self.request.user, 'view_users'):
            return User.objects.none()
        return User.objects.all()
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_role = instance.role
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log user update
        changes = []
        if old_role != instance.role:
            changes.append(f'role changed from {old_role} to {instance.role}')
        
        log_security_event(
            user=request.user,
            action='user_updated',
            description=f'Updated user: {instance.username}. Changes: {", ".join(changes) if changes else "profile updated"}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'updated_user_id': instance.id, 'changes': changes}
        )
        
        return Response({
            'message': 'User updated successfully',
            'user': UserListSerializer(instance).data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'error': 'Cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log user deletion
        log_security_event(
            user=request.user,
            action='user_deleted',
            description=f'Deleted user: {instance.username}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'deleted_user_id': instance.id, 'deleted_user_role': instance.role}
        )
        
        self.perform_destroy(instance)
        return Response({'message': 'User deleted successfully'})


class DeleteUserView(generics.DestroyAPIView):
    """
    Delete user endpoint (admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    
    @require_permission('delete_user')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Prevent self-deletion
        if instance == request.user:
            return Response(
                {'error': 'Cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log user deletion
        log_security_event(
            user=request.user,
            action='user_deleted',
            description=f'Deleted user: {instance.username}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'deleted_user_id': instance.id, 'deleted_user_role': instance.role}
        )
        
        # Actually delete the user
        username = instance.username
        self.perform_destroy(instance)
        
        return Response({
            'message': f'User "{username}" deleted successfully'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@require_permission('edit_user')
def unlock_user_account(request, user_id):
    """
    Unlock a user account (admin only)
    """
    try:
        user = User.objects.get(id=user_id)
        user.unlock_account()
        
        # Log account unlock
        log_security_event(
            user=request.user,
            action='account_unlocked',
            description=f'Unlocked account for user: {user.username}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'unlocked_user_id': user.id}
        )
        
        return Response({'message': f'Account unlocked for {user.username}'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)