"""
Management command to create default dashboard sections
"""
from django.core.management.base import BaseCommand
from facilities.models import DashboardSection


class Command(BaseCommand):
    help = 'Create default dashboard sections'
    
    def handle(self, *args, **options):
        sections_data = [
            {
                'name': 'Facility Information',
                'section_type': 'info',
                'order': 1,
                'field_schema': {
                    'fields': [
                        {'name': 'facility_name', 'type': 'text', 'label': 'Facility Name', 'required': True},
                        {'name': 'address', 'type': 'textarea', 'label': 'Address', 'required': False},
                        {'name': 'phone', 'type': 'tel', 'label': 'Phone Number', 'required': False},
                        {'name': 'manager', 'type': 'text', 'label': 'Manager', 'required': False},
                        {'name': 'operating_hours', 'type': 'text', 'label': 'Operating Hours', 'required': False},
                    ]
                }
            },
            {
                'name': 'Tank Status',
                'section_type': 'status',
                'order': 2,
                'field_schema': {
                    'fields': [
                        {'name': 'total_tanks', 'type': 'number', 'label': 'Total Tanks', 'required': False},
                        {'name': 'active_tanks', 'type': 'number', 'label': 'Active Tanks', 'required': False},
                        {'name': 'maintenance_tanks', 'type': 'number', 'label': 'Tanks in Maintenance', 'required': False},
                        {'name': 'last_inspection', 'type': 'date', 'label': 'Last Inspection', 'required': False},
                    ]
                }
            },
            {
                'name': 'Environmental Metrics',
                'section_type': 'metrics',
                'order': 3,
                'field_schema': {
                    'fields': [
                        {'name': 'air_quality_index', 'type': 'number', 'label': 'Air Quality Index', 'required': False},
                        {'name': 'water_quality', 'type': 'select', 'label': 'Water Quality', 'options': ['Excellent', 'Good', 'Fair', 'Poor'], 'required': False},
                        {'name': 'noise_level', 'type': 'number', 'label': 'Noise Level (dB)', 'required': False},
                        {'name': 'temperature', 'type': 'number', 'label': 'Temperature (°F)', 'required': False},
                    ]
                }
            },
            {
                'name': 'Safety Controls',
                'section_type': 'controls',
                'order': 4,
                'field_schema': {
                    'fields': [
                        {'name': 'emergency_contacts', 'type': 'textarea', 'label': 'Emergency Contacts', 'required': False},
                        {'name': 'safety_equipment', 'type': 'textarea', 'label': 'Safety Equipment', 'required': False},
                        {'name': 'evacuation_plan', 'type': 'text', 'label': 'Evacuation Plan', 'required': False},
                        {'name': 'last_safety_drill', 'type': 'date', 'label': 'Last Safety Drill', 'required': False},
                    ]
                }
            },
            {
                'name': 'Compliance Reports',
                'section_type': 'reports',
                'order': 5,
                'field_schema': {
                    'fields': [
                        {'name': 'last_audit', 'type': 'date', 'label': 'Last Audit Date', 'required': False},
                        {'name': 'compliance_status', 'type': 'select', 'label': 'Compliance Status', 'options': ['Compliant', 'Non-Compliant', 'Under Review'], 'required': False},
                        {'name': 'next_inspection', 'type': 'date', 'label': 'Next Inspection', 'required': False},
                        {'name': 'violations', 'type': 'number', 'label': 'Open Violations', 'required': False},
                    ]
                }
            },
        ]
        
        for section_data in sections_data:
            section, created = DashboardSection.objects.get_or_create(
                name=section_data['name'],
                defaults=section_data
            )
            if created:
                self.stdout.write(f"Created dashboard section: {section.name}")
        
        self.stdout.write(self.style.SUCCESS('Successfully created default dashboard sections'))