const express = require('express');
const path = require('path');
const fs = require('fs');

const { auth, role } = require('../middleware/auth');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const customerController = require('../controllers/customerController');
const propertyController = require('../controllers/propertyController');
const { landSaleController, houseRentalController, houseSaleController } = require('../controllers/saleControllers');
const usedItemController = require('../controllers/usedItemController');
const paymentController = require('../controllers/paymentController');
const commissionController = require('../controllers/commissionController');
const cleanerController = require('../controllers/cleanerController');
const userController = require('../controllers/userController');
const backupController = require('../controllers/backupController');
const notificationController = require('../controllers/notificationController');
const searchController = require('../controllers/searchController');
const recycleBinController = require('../controllers/recycleBinController');
const activityLogController = require('../controllers/activityLogController');
const settingsController = require('../controllers/settingsController');
const publicController = require('../controllers/publicController');
const uploads = require('../config/uploads');

const router = express.Router();

// Public (no auth) — customer-facing available listings
router.get('/public/listings', publicController.index);

// Auth
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.me);
router.post('/auth/logout', auth, authController.logout);
router.get('/register', auth, authController.showRegister);
router.post('/register', auth, authController.register);

// Dashboard
router.get('/dashboard', auth, dashboardController.index);

// Customers
router.get('/customers', auth, customerController.index);
router.post('/customers', auth, customerController.store);
router.get('/customers/:id', auth, customerController.show);
router.put('/customers/:id', auth, customerController.update);
router.delete('/customers/:id', auth, customerController.destroy);

// Properties
router.get('/properties/meta/create', auth, propertyController.createMeta);
router.get('/properties/:id/show-json', auth, propertyController.apiShow);
router.get('/properties', auth, propertyController.index);
router.post('/properties', auth, uploads.propertyImage, propertyController.store);
router.get('/properties/:id', auth, propertyController.show);
router.put('/properties/:id', auth, uploads.propertyImage, propertyController.update);
router.delete('/properties/:id', auth, propertyController.destroy);

// Land sales
router.get('/land-sales', auth, landSaleController.index);
router.get('/land-sales/meta/create', auth, landSaleController.createMeta);
router.get('/land-sales/:id/edit-meta', auth, landSaleController.editMeta);
router.post('/land-sales', auth, landSaleController.store);
router.get('/land-sales/:id', auth, landSaleController.show);
router.put('/land-sales/:id', auth, landSaleController.update);
router.patch('/land-sales/:id/toggle-status', auth, landSaleController.toggleStatus);
router.delete('/land-sales/:id', auth, landSaleController.destroy);

// House rentals
router.get('/house-rentals', auth, houseRentalController.index);
router.get('/house-rentals/meta/create', auth, houseRentalController.createMeta);
router.get('/house-rentals/:id/edit-meta', auth, houseRentalController.editMeta);
router.post('/house-rentals', auth, houseRentalController.store);
router.get('/house-rentals/:id', auth, houseRentalController.show);
router.put('/house-rentals/:id', auth, houseRentalController.update);
router.patch('/house-rentals/:id/toggle-status', auth, houseRentalController.toggleStatus);
router.delete('/house-rentals/:id', auth, houseRentalController.destroy);

// House sales
router.get('/house-sales', auth, houseSaleController.index);
router.get('/house-sales/meta/create', auth, houseSaleController.createMeta);
router.get('/house-sales/:id/edit-meta', auth, houseSaleController.editMeta);
router.post('/house-sales', auth, houseSaleController.store);
router.get('/house-sales/:id', auth, houseSaleController.show);
router.put('/house-sales/:id', auth, houseSaleController.update);
router.patch('/house-sales/:id/toggle-status', auth, houseSaleController.toggleStatus);
router.delete('/house-sales/:id', auth, houseSaleController.destroy);

// Used items
router.get('/used-items', auth, usedItemController.index);
router.get('/used-items/meta/create', auth, usedItemController.createMeta);
router.get('/used-items/:id/edit-meta', auth, usedItemController.editMeta);
router.post('/used-items', auth, usedItemController.store);
router.get('/used-items/:id', auth, usedItemController.show);
router.put('/used-items/:id', auth, usedItemController.update);
router.patch('/used-items/:id/toggle-status', auth, usedItemController.toggleStatus);
router.delete('/used-items/:id', auth, usedItemController.destroy);

// Payments
router.get('/payments', auth, paymentController.index);
router.get('/payments/meta/create', auth, paymentController.createMeta);
router.post('/payments', auth, paymentController.store);
router.get('/payments/:id', auth, paymentController.show);
router.put('/payments/:id', auth, paymentController.update);
router.delete('/payments/:id', auth, paymentController.destroy);

// Commissions
router.get('/commissions', auth, commissionController.index);
router.get('/commissions/:id', auth, commissionController.show);
router.delete('/commissions/:id', auth, commissionController.destroy);

// Cleaners
router.get('/cleaners', auth, cleanerController.index);
router.post('/cleaners', auth, cleanerController.store);
router.get('/cleaners/:id', auth, cleanerController.show);
router.put('/cleaners/:id', auth, cleanerController.update);
router.patch('/cleaners/:id/toggle-status', auth, cleanerController.toggleStatus);
router.delete('/cleaners/:id', auth, cleanerController.destroy);

// Users (super_admin only — same as Laravel role middleware)
router.get('/users', auth, role('super_admin'), userController.index);
router.post('/users', auth, role('super_admin'), userController.store);
router.get('/users/:id/edit-meta', auth, role('super_admin'), userController.editMeta);
router.get('/users/:id', auth, role('super_admin'), userController.show);
router.put('/users/:id', auth, role('super_admin'), userController.update);
router.delete('/users/:id', auth, role('super_admin'), userController.destroy);

// Backups
router.get('/backups', auth, backupController.index);
router.post('/backups', auth, backupController.create);
router.get('/backups/:filename/download', auth, backupController.download);
router.delete('/backups/:filename', auth, backupController.destroy);

// Notifications
router.get('/notifications', auth, notificationController.index);
router.get('/notifications/unread-count', auth, notificationController.unreadCount);
router.post('/notifications/read-all', auth, notificationController.markAllAsRead);
router.post('/notifications/:id/read', auth, notificationController.markAsRead);

// Search
router.get('/search', auth, searchController.search);

// Recycle bin
router.get('/recycle-bin', auth, recycleBinController.index);
router.post('/recycle-bin/:type/:id/restore', auth, recycleBinController.restore);
router.delete('/recycle-bin/:type/:id/force-delete', auth, recycleBinController.forceDelete);

// Activity logs
router.get('/activity-logs', auth, activityLogController.index);

// Settings
router.get('/settings', auth, settingsController.index);
router.post('/settings/language/:locale', auth, settingsController.toggleLanguage);
router.post('/settings/two-factor/toggle', auth, settingsController.toggleTwoFactor);
router.post('/settings/security', auth, settingsController.updateSecurity);
router.post('/settings/profile', auth, uploads.profilePicture, settingsController.updateProfile);
router.post('/settings/password', auth, settingsController.changePassword);
router.post('/settings/profile-picture', auth, uploads.profilePicture, settingsController.updateProfilePicture);
router.post('/settings/profile-picture/remove', auth, settingsController.removeProfilePicture);
router.post('/settings/color', auth, settingsController.updateColor);
router.post('/settings/font', auth, settingsController.updateFont);
router.post('/settings/commission', auth, settingsController.updateCommission);
router.post('/settings/clear-data', auth, settingsController.clearData);

module.exports = router;
