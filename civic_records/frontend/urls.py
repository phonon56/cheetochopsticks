"""Frontend URL routing."""
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("parcel/<str:parcel_id>/", views.parcel_detail,
         name="parcel_detail"),
    path("record/<str:record_id>/", views.record_detail,
         name="record_detail"),
    path("project/<slug:slug>/", views.project_detail,
         name="project_detail"),
]
