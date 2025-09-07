/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import DocumentRequestsController from '#controllers/document_requests_controller'
import PaymentsController from '#controllers/payments_controller'
import StaffController from '#controllers/staff_controller'
import GetFilesController from '#controllers/get_files_controller'
import AuthController from '#controllers/auth_controller'
import StudentController from '#controllers/students_controller'
import EmailsController from '#controllers/emails_controller'
// Public routes
router.group(() => {
  router.post('/requests', [DocumentRequestsController, 'store'])
  router.get('/requests/:tracking_id', [DocumentRequestsController, 'show'])
  router.post('/payments/:reference/callback', [PaymentsController, 'callback'])
  router.get('/payments/:reference/status', [PaymentsController, 'checkPaymentStatus'])
  router.get('uploads/*', [GetFilesController, 'getFile'])
  router.get('tmp/*', [GetFilesController, 'getFileFromTmp'])

  router.post('/students/verify', [StudentController, 'verify'])

  router.post('/emails/send', [EmailsController, 'sendRecap'])

  // Authentication routes
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
  router.get('/auth/check', async ({ auth }) => {
    return { isAuthenticated: await auth.check() }
  })
}).prefix('/api/v1')

// Staff routes
router.group(() => {
  // Demandes
  router.get('/requests', [StaffController, 'index'])
  router.get('/requests/:id', [StaffController, 'show'])
  router.post('/requests/validate/:id', [StaffController, 'validate'])
  router.put('/requests/:id/status', [StaffController, 'updateStatus'])
  router.delete('/requests/:id', [StaffController, 'cancel'])
  router.post('/requests/:id/email', [StaffController, 'sendCustomEmail'])

  // Validation
  router.post('/requests/:id/validate', [StaffController, 'validate'])

  // Documents
  router.get('/documents', [StaffController, 'listDocuments'])
  router.post('/requests/:id/generate', [StaffController, 'generate'])
  router.get('/documents/:id/download', [StaffController, 'download'])

  // Suivi
  router.get('/validations', [StaffController, 'validationsHistory'])

  router.post('/logout', [AuthController,'logout'])
}).prefix('/api/v1/staff')
  .use([
    middleware.auth()])

// Admin routes
router.group(() => {
  router.get('/metrics', [StaffController, 'getMetrics'])
}).prefix('/api/v1/admin')
  .use([
    middleware.auth()])