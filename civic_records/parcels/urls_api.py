"""API URL routing for parcels."""
from rest_framework.routers import DefaultRouter
from .views import ParcelViewSet

router = DefaultRouter()
router.register(r"parcels", ParcelViewSet, basename="parcel")

urlpatterns = router.urls
