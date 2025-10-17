"""
Custom password validators for enhanced security
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class CustomPasswordValidator:
    """
    Custom password validator with comprehensive security requirements
    """
    
    def validate(self, password, user=None):
        """
        Validate password against security requirements
        """
        errors = []
        
        # Minimum length check (handled by MinimumLengthValidator)
        if len(password) < 9:
            errors.append(_("Password must be at least 9 characters long."))
        
        # Character variety requirements
        if not re.search(r'[A-Z]', password):
            errors.append(_("Password must contain at least one uppercase letter."))
        
        if not re.search(r'[a-z]', password):
            errors.append(_("Password must contain at least one lowercase letter."))
        
        if not re.search(r'\d', password):
            errors.append(_("Password must contain at least one digit."))
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(_("Password must contain at least one special character."))
        
        # Check for common patterns
        if re.search(r'(.)\1{2,}', password):
            errors.append(_("Password cannot contain three or more consecutive identical characters."))
        
        # Check for sequential characters
        sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
                    'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop']
        
        password_lower = password.lower()
        for seq in sequences:
            if seq in password_lower or seq[::-1] in password_lower:
                errors.append(_("Password cannot contain common sequential characters."))
                break
        
        # Check against user information if available
        if user:
            user_info = [
                getattr(user, 'username', ''),
                getattr(user, 'first_name', ''),
                getattr(user, 'last_name', ''),
                getattr(user, 'email', '').split('@')[0] if getattr(user, 'email', '') else ''
            ]
            
            for info in user_info:
                if info and len(info) > 2 and info.lower() in password_lower:
                    errors.append(_("Password cannot contain personal information."))
                    break
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        return _(
            "Your password must contain at least 9 characters including "
            "uppercase and lowercase letters, numbers, and special characters. "
            "It cannot contain personal information or common patterns."
        )