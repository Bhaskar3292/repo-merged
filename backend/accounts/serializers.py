"""
Serializers for user authentication and management
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    password = serializers.CharField(write_only=True, min_length=12)
    two_factor_enabled = serializers.BooleanField(read_only=True)
    is_account_locked = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    effective_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'role', 'is_active', 'created_at', 'password', 
                 'two_factor_enabled', 'is_account_locked', 'last_login',
                 'is_superuser', 'effective_role']
        extra_kwargs = {
            'password': {'write_only': True},
            'created_at': {'read_only': True},
        }
    
    def get_is_account_locked(self, obj):
        return obj.is_account_locked()
    
    def get_effective_role(self, obj):
        """Return effective role considering superuser status"""
        if obj.is_superuser:
            return 'admin'
        return obj.role
    
    def validate_password(self, value):
        """Validate password using Django's password validators"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
            instance.last_password_change = timezone.now()
        
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    totp_token = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        totp_token = attrs.get('totp_token', '')
        
        if email and password:
            # Try to find user by email
            try:
                user = User.objects.get(email=email)
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            
            # Check if account is locked
            if user.is_account_locked():
                raise serializers.ValidationError('Account is temporarily locked due to multiple failed login attempts')
            
            # Authenticate user
            request = self.context.get('request')
            user = authenticate(request=request, username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            # Check 2FA if enabled
            if user.two_factor_enabled:
                if not totp_token:
                    raise serializers.ValidationError('Two-factor authentication token required')
                
                if not user.verify_totp(totp_token) and not user.use_backup_code(totp_token):
                    raise serializers.ValidationError('Invalid two-factor authentication token')
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=12)
    confirm_password = serializers.CharField()
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value
    
    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError("New password must be different from current password")
        
        return attrs


class TwoFactorSetupSerializer(serializers.Serializer):
    """
    Serializer for 2FA setup
    """
    totp_token = serializers.CharField(max_length=6, min_length=6)
    
    def validate_totp_token(self, value):
        user = self.context['request'].user
        if not user.totp_secret:
            raise serializers.ValidationError('2FA setup not initiated')
        
        if not user.verify_totp(value):
            raise serializers.ValidationError('Invalid TOTP token')
        
        return value


class TwoFactorVerifySerializer(serializers.Serializer):
    """
    Serializer for 2FA verification during login
    """
    token = serializers.CharField(max_length=8)
    
    def validate_token(self, value):
        # Token can be either TOTP (6 digits) or backup code (8 chars)
        if len(value) not in [6, 8]:
            raise serializers.ValidationError('Invalid token format')
        return value


class CreateUserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (admin only)
    """
    password = serializers.CharField(write_only=True, min_length=12)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'role', 'first_name', 'last_name', 'email']
        extra_kwargs = {
            'email': {'required': True},  # Make email required for user creation
        }
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing users - only username and role
    """
    
    class Meta:
        model = User
        fields = ['id', 'username', 'role']