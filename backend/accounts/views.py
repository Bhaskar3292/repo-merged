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
from django.utils import timezone
from django.conf import settings
import logging
import qrcode
import io
import base64
from .utils import get_client_ip, log_security_event
from .models import User
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
        logger.info(f"Logout request received from user: {getattr(request.user, 'username', 'Anonymous')}")
        logger.info(f"Request data: {request.data}")
        
        try:
            # Get refresh token from request
            refresh_token = request.data.get('refresh_token') or request.data.get('refresh')
            logger.info(f"Refresh token received: {bool(refresh_token)}")
            
            if refresh_token:
                try:
                    # Validate and blacklist the refresh token
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                    logger.info("Refresh token successfully blacklisted")
                except TokenError as e:
                    logger.warning(f"Token error during logout: {e}")
                    # Don't fail logout if token is already invalid/expired
                except Exception as e:
                    logger.error(f"Unexpected error blacklisting token: {e}")
                    # Don't fail logout for token issues
            else:
                logger.warning("No refresh token provided in logout request")
            
            # Log logout event (only if user is authenticated)
            if request.user and request.user.is_authenticated:
                log_security_event(
                    user=request.user,
                    action='logout',
                    description=f'User logged out',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                logger.info(f"Logout successful for user: {request.user.username}")
            else:
                logger.info("Logout request from unauthenticated user")
            
            return Response({
                'message': 'Logout successful',
                'status': 'success'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error during logout: {e}", exc_info=True)
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
    permission_classes = [IsAdminUser]
    
    def create(self, request, *args, **kwargs):
        logger.info(f"User creation request from: {request.user.username} (role: {request.user.role})")
        logger.info(f"Request data: {request.data}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            logger.info(f"User created successfully: {user.username}")
        except Exception as e:
            logger.error(f"User creation failed: {e}")
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
    queryset = User.objects.all().order_by('-created_at')
    
    def get_queryset(self):
        import logging
        logger = logging.getLogger(__name__)
        
        # Check if user is admin or superuser
        user = self.request.user
        logger.info(f"UserListView accessed by: {user.username} (role: {user.role}, superuser: {user.is_superuser})")
        
        if user.is_superuser or user.role == 'admin':
            queryset = User.objects.all().order_by('-created_at')
            logger.info(f"Returning {queryset.count()} users")
            return queryset
        else:
            logger.warning(f"User {user.username} with role {user.role} denied access to user list")
            return User.objects.none()
    
    def list(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        queryset = self.filter_queryset(self.get_queryset())
        logger.info(f"Filtered queryset count: {queryset.count()}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            logger.info(f"Serialized {len(serializer.data)} users")
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Serialized {len(serializer.data)} users")
        return Response(serializer.data)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    User detail endpoint (admin only)
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    
    def get_queryset(self):
        # Check if user is admin or superuser
        if not (self.request.user.role == 'admin' or self.request.user.is_superuser):
            return User.objects.none()
        return User.objects.all()
    
    def update(self, request, *args, **kwargs):
        # Check if user is admin or superuser
        if not (request.user.role == 'admin' or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can update users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
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
        # Check if user is admin or superuser
        if not (request.user.role == 'admin' or request.user.is_superuser):
            return Response(
                {'error': 'Only administrators can delete users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unlock_user_account(request, user_id):
    """
    Unlock a user account (admin only)
    """
    # Check if user is admin or superuser
    if not (request.user.role == 'admin' or request.user.is_superuser):
        return Response(
            {'error': 'Only administrators can unlock accounts'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
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