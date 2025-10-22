from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PermitViewSet, basename='permit')

urlpatterns = [
    path('upload/', views.PermitUploadView.as_view(), name='permit-upload'),
    path('stats/', views.permit_stats, name='permit-stats'),
    path('', include(router.urls)),
]
