"""
URL patterns for permissions app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Permission categories and permissions
    path('categories/', views.PermissionCategoryListView.as_view(), name='permission_categories'),
    path('permissions/', views.PermissionListView.as_view(), name='permissions'),

    # Role permissions - Matrix view
    path('role-permissions/', views.RolePermissionListView.as_view(), name='role_permissions_list'),
    path('update-role-permission/', views.update_role_permission, name='update_role_permission'),
    path('bulk-update/', views.bulk_update_permissions, name='bulk_update_permissions'),

    # Legacy endpoints (for backwards compatibility)
    path('roles/<str:role>/permissions/', views.RolePermissionListView.as_view(), name='role_permissions'),
    path('role-permissions/<int:pk>/', views.RolePermissionUpdateView.as_view(), name='role_permission_update'),
    path('roles/permissions/bulk-update/', views.bulk_update_role_permissions, name='bulk_update_role_permissions'),
    path('roles/permissions/matrix/', views.get_role_permissions_matrix, name='role_permissions_matrix'),

    # User permissions
    path('user/check/', views.check_user_permissions, name='check_user_permissions'),
    path('user/permissions/', views.get_user_permissions, name='get_user_permissions'),
]