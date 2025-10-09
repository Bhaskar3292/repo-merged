from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0002_remove_location_email_remove_location_phone'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommanderInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('commander_type', models.CharField(blank=True, max_length=100)),
                ('serial_number', models.CharField(blank=True, max_length=100)),
                ('service_id',models.CharField(blank=True,max_length=100)),
                ('asm_subscription', models.CharField(blank=True, choices=[('Own', 'Own'), ('Brand Operated', 'Brand Operated')], max_length=50)),
                ('base_software_version', models.CharField(blank=True, max_length=50)),
                ('tunnel_ip', models.CharField(blank=True, max_length=50)),
                ('payment_processor',models.CharField(blank=True,max_length=100)),
                ('user_id', models.CharField(blank=True, max_length=100)),
                ('password', models.CharField(blank=True, max_length=255)),
                ('issue_date', models.DateField(blank=True, null=True)),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='commanders', to='facilities.location')),
            ],
            options={
                'verbose_name': 'Commander Info',
                'verbose_name_plural': 'Commander Info',
                'ordering': ['-created_at'],
            },
        ),
    ]
