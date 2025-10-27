from django.db import models
from django.conf import settings
from datetime import date, timedelta
import os


def permit_upload_path(instance, filename):
    """
    Generate upload path for permit documents based on location.
    Returns: permits/{location_id}-{location_name}/{filename}
    Example: permits/67266-lowber/air_permit.pdf
    """
    if instance.facility:
        location_name = instance.facility.name.lower().replace(' ', '-')
        location_folder = f"{instance.facility.id}-{location_name}"
        return os.path.join('permits', location_folder, filename)
    return os.path.join('permits', filename)


class Permit(models.Model):
    name = models.CharField(max_length=255)
    number = models.CharField(max_length=255, unique=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField()
    issued_by = models.CharField(max_length=255)

    is_active = models.BooleanField(default=True)
    parent_permit = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='renewals'
    )

    renewal_url = models.URLField(null=True, blank=True)
    document = models.FileField(upload_to=permit_upload_path, null=True, blank=True)

    facility = models.ForeignKey(
        'facilities.Location',
        on_delete=models.CASCADE,
        related_name='facility_permits'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.number})"

    @property
    def status(self):
        if not self.is_active:
            return 'superseded'

        today = date.today()
        days_until_expiry = (self.expiry_date - today).days

        if days_until_expiry < 0:
            return 'expired'
        elif days_until_expiry <= 30:
            return 'expiring'
        else:
            return 'active'

    @property
    def document_url(self):
        if self.document:
            return self.document.url
        return None


class PermitHistory(models.Model):
    permit = models.ForeignKey(
        Permit,
        on_delete=models.CASCADE,
        related_name='history'
    )
    action = models.CharField(max_length=255)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    notes = models.TextField(blank=True)
    document_url = models.URLField(max_length=512, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Permit histories'

    def __str__(self):
        return f"{self.permit.number} - {self.action}"
