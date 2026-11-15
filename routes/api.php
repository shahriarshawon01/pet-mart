<?php

use App\Http\Controllers\Api\v1\Admin\BannerAdminController;
use App\Http\Controllers\Api\v1\Admin\CategoryAdminController;
use App\Http\Controllers\Api\v1\Admin\ContactMessageAdminController;
use App\Http\Controllers\Api\v1\Admin\InquiryAdminController;
use App\Http\Controllers\Api\v1\Admin\DashboardAdminController;
use App\Http\Controllers\Api\v1\Admin\LocationAdminController;
use App\Http\Controllers\Api\v1\Admin\ModerationController;
use App\Http\Controllers\Api\v1\Admin\NotificationAdminController;
use App\Http\Controllers\Api\v1\Admin\ReportAdminController;
use App\Http\Controllers\Api\v1\Admin\UploadAdminController;
use App\Http\Controllers\Api\v1\Admin\AdminUserController;
use App\Http\Controllers\Api\v1\Admin\MemberAdminController;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\BannerController;
use App\Http\Controllers\Api\v1\CategoryController;
use App\Http\Controllers\Api\v1\ContactController;
use App\Http\Controllers\Api\v1\InquiryController;
use App\Http\Controllers\Api\v1\LocationController;
use App\Http\Controllers\Api\v1\ProductController;
use App\Http\Controllers\Api\v1\ProductReportController;
use App\Http\Controllers\Api\v1\SettingController;
use App\Http\Controllers\Api\v1\UploadController;
use App\Http\Controllers\Api\v1\WishlistController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\GeneralController;
use App\Http\Controllers\GeneralSettingController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'admin'])->group(function () {
    Route::post('/configurations', [ConfigurationController::class, 'getConfigurations']);
    Route::post('/general', [GeneralController::class, 'getGeneralData']);

    Route::get('/profile', [ProfileController::class, 'getProfile']);
    Route::post('/profile', [ProfileController::class, 'updateProfile'])->middleware('throttle:10,1');

    Route::post('/modules/status', [ModuleController::class, 'status']);
    Route::post('/roles/status', [RoleController::class, 'status']);
    Route::apiResource('/modules', ModuleController::class);
    Route::apiResource('/roles', RoleController::class);
    Route::apiResource('/role_permissions', RolePermissionController::class);

    Route::prefix('general_setting')->group(function () {
        Route::get('/', [GeneralSettingController::class, 'index']);
        Route::post('/', [GeneralSettingController::class, 'update']);
        Route::post('/{key}/image', [GeneralSettingController::class, 'uploadImage'])
            ->where('key', '[a-z0-9_]+')->middleware('throttle:20,1');
        Route::delete('/{key}/image', [GeneralSettingController::class, 'removeImage'])
            ->where('key', '[a-z0-9_]+');
    });

    Route::prefix('v1/admin')->group(function () {
        Route::get('/dashboard-stats', [DashboardAdminController::class, 'stats']);

        Route::get('/notifications', [NotificationAdminController::class, 'index']);
        Route::get('/notifications/summary', [NotificationAdminController::class, 'summary']);
        Route::post('/notifications/read-all', [NotificationAdminController::class, 'markAllRead']);
        Route::post('/notifications/{id}/read', [NotificationAdminController::class, 'markRead'])->whereUuid('id');
        Route::delete('/notifications/{id}', [NotificationAdminController::class, 'destroy'])->whereUuid('id');

        Route::post('/uploads/images', [UploadAdminController::class, 'image'])->middleware('throttle:30,1');

        Route::get('/moderation', [ModerationController::class, 'index']);
        Route::get('/moderation/{id}', [ModerationController::class, 'show'])->whereNumber('id');
        Route::post('/moderation/{id}/approve', [ModerationController::class, 'approve'])->whereNumber('id');
        Route::post('/moderation/{id}/reject', [ModerationController::class, 'reject'])->whereNumber('id');
        Route::post('/moderation/{id}/feature', [ModerationController::class, 'toggleFeatured'])->whereNumber('id');
        Route::delete('/moderation/{id}', [ModerationController::class, 'destroy'])->whereNumber('id');

        Route::get('/categories', [CategoryAdminController::class, 'index']);
        Route::post('/categories', [CategoryAdminController::class, 'store']);
        Route::put('/categories/{id}', [CategoryAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/categories/{id}', [CategoryAdminController::class, 'destroy'])->whereNumber('id');
        Route::post('/categories/{id}/attributes', [CategoryAdminController::class, 'storeAttribute'])->whereNumber('id');
        Route::put('/attributes/{id}', [CategoryAdminController::class, 'updateAttribute'])->whereNumber('id');
        Route::delete('/attributes/{id}', [CategoryAdminController::class, 'destroyAttribute'])->whereNumber('id');

        Route::get('/members', [MemberAdminController::class, 'index']);
        Route::put('/members/{id}', [MemberAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/members/{id}', [MemberAdminController::class, 'destroy'])->whereNumber('id');
        Route::post('/members/{id}/toggle-verification', [MemberAdminController::class, 'toggleVerification'])->whereNumber('id');
        Route::post('/members/{id}/toggle-status', [MemberAdminController::class, 'toggleStatus'])->whereNumber('id');

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{id}', [AdminUserController::class, 'update'])->whereNumber('id');
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->whereNumber('id');
        Route::post('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus'])->whereNumber('id');

        Route::get('/reports', [ReportAdminController::class, 'index']);
        Route::post('/reports/{id}/resolve', [ReportAdminController::class, 'resolve'])->whereNumber('id');
        Route::post('/reports/{id}/dismiss', [ReportAdminController::class, 'dismiss'])->whereNumber('id');

        Route::get('/banners', [BannerAdminController::class, 'index']);
        Route::post('/banners', [BannerAdminController::class, 'store']);
        Route::put('/banners/{id}', [BannerAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/banners/{id}', [BannerAdminController::class, 'destroy'])->whereNumber('id');

        Route::get('/locations', [LocationAdminController::class, 'index']);
        Route::post('/locations', [LocationAdminController::class, 'store']);
        Route::put('/locations/{id}', [LocationAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/locations/{id}', [LocationAdminController::class, 'destroy'])->whereNumber('id');
        Route::post('/locations/{id}/toggle-status', [LocationAdminController::class, 'toggleStatus'])->whereNumber('id');

        Route::get('/inquiries/sellers', [InquiryAdminController::class, 'sellers']);
        Route::get('/inquiries/sellers/{seller}/listings', [InquiryAdminController::class, 'listings'])->whereNumber('seller');
        Route::get('/inquiries/listings/{product}/threads', [InquiryAdminController::class, 'threads'])->whereNumber('product');
        Route::get('/inquiries/listings/{product}/threads/{buyer}', [InquiryAdminController::class, 'show'])->whereNumber(['product', 'buyer']);
        Route::delete('/inquiries/listings/{product}/threads/{buyer}', [InquiryAdminController::class, 'destroyThread'])->whereNumber(['product', 'buyer']);
        Route::post('/inquiries/listings/{product}/threads/{buyer}/restore', [InquiryAdminController::class, 'restoreThread'])->whereNumber(['product', 'buyer']);
        Route::put('/inquiries/{id}', [InquiryAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/inquiries/{id}', [InquiryAdminController::class, 'destroy'])->whereNumber('id');
        Route::post('/inquiries/{id}/restore', [InquiryAdminController::class, 'restore'])->whereNumber('id');

        Route::get('/contact-messages', [ContactMessageAdminController::class, 'index']);
        Route::put('/contact-messages/{id}', [ContactMessageAdminController::class, 'update'])->whereNumber('id');
        Route::delete('/contact-messages/{id}', [ContactMessageAdminController::class, 'destroy'])->whereNumber('id');
    });
});

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
        Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{slug}', [CategoryController::class, 'show']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{identifier}', [ProductController::class, 'show']);
    Route::get('/locations', [LocationController::class, 'index']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/banners', [BannerController::class, 'index']);
    Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:3,10');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/me', [AuthController::class, 'updateProfile']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,1');
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::post('/uploads/images', [UploadController::class, 'image'])->middleware('throttle:30,1');

        Route::post('/products', [ProductController::class, 'store'])->middleware('throttle:10,1');
        Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
        Route::get('/my-listings', [ProductController::class, 'myListings']);
        Route::post('/products/{id}/mark-sold', [ProductController::class, 'markAsSold'])->whereNumber('id');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);

        Route::get('/inquiries', [InquiryController::class, 'index']);
        Route::post('/inquiries', [InquiryController::class, 'store'])->middleware('throttle:10,1');
        Route::post('/inquiries/{id}/reply', [InquiryController::class, 'reply'])->whereNumber('id')->middleware('throttle:20,1');
        Route::post('/inquiries/{id}/read', [InquiryController::class, 'markRead'])->whereNumber('id');

        Route::post('/products/{id}/report', [ProductReportController::class, 'store'])->whereNumber('id')->middleware('throttle:10,1');
    });
});
