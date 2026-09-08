from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# INI BARIS YANG TADI KETINGGALAN
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # INI JALUR LOGIN-NYA YANG KEMBALI KITA PASANG
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Jalur untuk folder gambar/file
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)