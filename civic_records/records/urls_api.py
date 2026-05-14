"""API URL routing for records."""
from rest_framework.routers import DefaultRouter
from .views import RecordViewSet

router = DefaultRouter()
router.register(r"records", RecordViewSet, basename="record")

urlpatterns = router.urls
