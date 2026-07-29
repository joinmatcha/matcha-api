/**
 * Documentation Swagger centralisée pour l'API Matcha
 *
 * Ce fichier contient toutes les définitions Swagger/OpenAPI pour l'API.
 * Format: JSDoc avec annotations @swagger
 */

export const swaggerDocs = {
  // ==================== HEALTH ====================
  health: `
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifier l'état de santé de l'API
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: L'API fonctionne correctement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 */
`,

  // ==================== AUTH ====================
  authLogin: `
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authentification utilisateur
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 *       400:
 *         description: Données de requête invalides
 */
`,

  authRequestReset: `
/**
 * @swagger
 * /api/auth/request-reset:
 *   post:
 *     summary: Demande de réinitialisation du mot de passe
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 *       400:
 *         description: Données invalides
 */
`,

  authResetPassword: `
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset-token-here
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
`,

  // ==================== USERS ====================
  usersCreate: `
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouveau utilisateur
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: L'utilisateur existe déjà
 */
`,

  usersVerifyEmail: `
/**
 * @swagger
 * /api/users/verify-email:
 *   get:
 *     summary: Vérifier l'email de l'utilisateur
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de vérification d'email
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
`,

  usersGetById: `
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 */
`,

  // ==================== PROFILE ====================
  profileGet: `
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 location:
 *                   type: string
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Non authentifié
 */
`,

  profileUpdate: `
/**
 * @swagger
 * /api/profile:
 *   patch:
 *     summary: Mettre à jour le profil de l'utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               bio:
 *                 type: string
 *                 example: Développeur passionné
 *               location:
 *                 type: string
 *                 example: Paris, France
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["JavaScript", "TypeScript", "React"]
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
`,

  profileChangePassword: `
/**
 * @swagger
 * /api/profile/change-password:
 *   post:
 *     summary: Changer le mot de passe de l'utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword456
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Mot de passe actuel incorrect
 *       401:
 *         description: Non authentifié
 */
`,

  profileDeleteAccount: `
/**
 * @swagger
 * /api/profile/account:
 *   delete:
 *     summary: Supprimer le compte utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *       401:
 *         description: Non authentifié
 */
`,

  // ==================== PERSONALITY ====================
  personalityGetActive: `
/**
 * @swagger
 * /api/personality/active:
 *   get:
 *     summary: Récupérer le test de personnalité actif
 *     tags: [Personality]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test de personnalité récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                   example: Test de personnalité MBTI
 *                 description:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                 isActive:
 *                   type: boolean
 *       404:
 *         description: Aucun test actif trouvé
 *       401:
 *         description: Non authentifié
 */
`,

  personalitySubmit: `
/**
 * @swagger
 * /api/personality/submit:
 *   post:
 *     summary: Soumettre les réponses au test de personnalité
 *     tags: [Personality]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *               - answers
 *             properties:
 *               testId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *                 example:
 *                   - questionId: "q1"
 *                     answer: "option1"
 *                   - questionId: "q2"
 *                     answer: "option2"
 *     responses:
 *       200:
 *         description: Réponses soumises avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     personalityType:
 *                       type: string
 *                       example: INTJ
 *                     traits:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
`,

  // ==================== JOBS ====================
  jobGetDeck: `
/**
 * @swagger
 * /api/jobs/deck:
 *   get:
 *     summary: Récupérer le deck de métiers à swiper
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: Nombre de métiers à retourner
 *     responses:
 *       200:
 *         description: Deck récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       title:
 *                         type: string
 *                         example: Développeur logiciel
 *                       description:
 *                         type: string
 *                       sector:
 *                         type: string
 *                         example: Informatique
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                 remaining:
 *                   type: integer
 *                   example: 8
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       401:
 *         description: Non authentifié
 */
`,

  jobSwipe: `
/**
 * @swagger
 * /api/jobs/swipe:
 *   post:
 *     summary: Enregistrer un swipe sur un métier
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - action
 *             properties:
 *               jobId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               action:
 *                 type: string
 *                 enum: [like, dislike]
 *                 example: like
 *     responses:
 *       201:
 *         description: Swipe enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 swipe:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     jobId:
 *                       type: string
 *                     action:
 *                       type: string
 *                       enum: [like, dislike]
 *                     swipedAt:
 *                       type: string
 *                       format: date-time
 *                 remaining:
 *                   type: integer
 *                   example: 7
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Métier introuvable
 *       409:
 *         description: Ce métier a déjà été swipé aujourd'hui
 *       429:
 *         description: Quota journalier atteint
 */
`,

  // ==================== USERS (suite) ====================
  usersGetPreferences: `
/**
 * @swagger
 * /api/users/me/preferences:
 *   get:
 *     summary: Récupérer les préférences métiers calculées depuis l'historique de swipes
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Préférences récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     totalLikes:
 *                       type: integer
 *                       example: 12
 *                     totalDislikes:
 *                       type: integer
 *                       example: 5
 *                     topSectors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: Informatique
 *                           score:
 *                             type: number
 *                             example: 4.5
 *                     topCompetences:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           score:
 *                             type: number
 *                     topTags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           score:
 *                             type: number
 *                     topWorkConditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           score:
 *                             type: number
 *                     recentLikes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           sector:
 *                             type: string
 *       401:
 *         description: Non authentifié
 */
`,

  // ==================== REDIRECT ====================
  redirectResetPassword: `
/**
 * @swagger
 * /api/auth/password-reset/redirect:
 *   get:
 *     summary: Rediriger vers l'application pour la réinitialisation du mot de passe
 *     tags: [Redirect]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation du mot de passe
 *     responses:
 *       302:
 *         description: Redirection vers l'application
 *       400:
 *         description: Token manquant
 */
`,

  // ==================== ADMIN ====================
  adminLogin: `
/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Authentification administrateur
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassw0rd!
 *     responses:
 *       200:
 *         description: Connexion admin réussie. Pose un cookie httpOnly admin_token.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: Cookie httpOnly admin_token
 *       401:
 *         description: Identifiants invalides
 *       403:
 *         description: Accès admin requis
 */
`,

  adminLogout: `
/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Déconnexion administrateur
 *     tags: [Admin]
 *     security: []
 *     responses:
 *       200:
 *         description: Cookie admin supprimé
 */
`,

  adminUsers: `
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lister les utilisateurs pour le back-office
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: subscription
 *         schema:
 *           type: string
 *           enum: [free, premium]
 *       - in: query
 *         name: isEmailVerified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès admin requis
 */
`,

  adminUpdateUser: `
/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Modifier un utilisateur depuis le back-office
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               subscription:
 *                 type: string
 *                 enum: [free, premium]
 *               isEmailVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Utilisateur introuvable
 *       409:
 *         description: Email déjà utilisé
 */
`,

  adminPersonalityVersions: `
/**
 * @swagger
 * /api/admin/personality-versions:
 *   get:
 *     summary: Lister les templates de test de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste paginée des templates
 *   post:
 *     summary: Créer un template de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Template créé
 */
`,

  adminUpdatePersonalityVersion: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}:
 *   patch:
 *     summary: Modifier un template de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template mis à jour
 *       404:
 *         description: Template introuvable
 */
`,

  adminDuplicatePersonalityVersion: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}/duplicate:
 *   post:
 *     summary: Dupliquer un template de personnalité vers une nouvelle version
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 example: 2.0
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nouvelle version créée
 *       409:
 *         description: Version déjà existante
 */
`,

  adminActivatePersonalityVersion: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}/activate:
 *   post:
 *     summary: Activer une version de template de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template activé, les autres versions sont désactivées
 *       400:
 *         description: Template invalide pour activation
 *       404:
 *         description: Template introuvable
 */
`,

  adminDeactivatePersonalityVersion: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}/deactivate:
 *   post:
 *     summary: Désactiver une version de template de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template désactivé
 *       404:
 *         description: Template introuvable
 */
`,

  adminTemplateQuestions: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}/questions:
 *   post:
 *     summary: Ajouter une question à un template de personnalité
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Question ajoutée
 *       409:
 *         description: Identifiant de question déjà utilisé dans le template
 */
`,

  adminTemplateQuestionUpdateDelete: `
/**
 * @swagger
 * /api/admin/personality-versions/{id}/questions/{questionId}:
 *   patch:
 *     summary: Modifier une question précise d'un template
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question mise à jour
 *       404:
 *         description: Question introuvable
 *       409:
 *         description: Identifiant de question déjà utilisé
 *   delete:
 *     summary: Supprimer une question précise d'un template
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question supprimée
 *       404:
 *         description: Question introuvable
 */
`,

  adminBilanQuestions: `
/**
 * @swagger
 * /api/admin/bilan-questions:
 *   get:
 *     summary: Lister les questions de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste paginée des questions
 *   post:
 *     summary: Créer une question de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Question créée
 *       409:
 *         description: Code déjà utilisé
 */
`,

  adminBilanVersions: `
/**
 * @swagger
 * /api/admin/bilan-versions:
 *   get:
 *     summary: Lister les versions de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste paginée des versions de bilan
 *   post:
 *     summary: Créer une version de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Version de bilan créée
 *       409:
 *         description: Version déjà existante
 */
`,

  adminUpdateBilanVersion: `
/**
 * @swagger
 * /api/admin/bilan-versions/{version}:
 *   patch:
 *     summary: Modifier une version de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Version de bilan mise à jour
 *       404:
 *         description: Version de bilan introuvable
 */
`,

  adminDuplicateBilanVersion: `
/**
 * @swagger
 * /api/admin/bilan-versions/{version}/duplicate:
 *   post:
 *     summary: Dupliquer une version de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Version de bilan dupliquée
 *       404:
 *         description: Version source introuvable
 *       409:
 *         description: Version cible déjà existante
 */
`,

  adminActivateBilanVersion: `
/**
 * @swagger
 * /api/admin/bilan-versions/{version}/activate:
 *   post:
 *     summary: Activer une version de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Version de bilan activée
 *       400:
 *         description: Aucune question active sur cette version
 *       404:
 *         description: Version introuvable
 */
`,

  adminDeactivateBilanVersion: `
/**
 * @swagger
 * /api/admin/bilan-versions/{version}/deactivate:
 *   post:
 *     summary: Désactiver une version de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Version de bilan désactivée
 *       404:
 *         description: Version introuvable
 */
`,

  adminUpdateBilanQuestion: `
/**
 * @swagger
 * /api/admin/bilan-questions/{id}:
 *   patch:
 *     summary: Modifier une question de bilan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question mise à jour
 *       404:
 *         description: Question introuvable
 *       409:
 *         description: Code déjà utilisé
 */
`,

  // ==================== ANALYTICS / MATCHA INSIGHTS ====================
  analyticsCreateEvent: `
/**
 * @swagger
 * /api/analytics/events:
 *   post:
 *     summary: Collecter un événement produit Matcha Insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - sessionId
 *               - source
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum:
 *                   - test_started
 *                   - test_step_completed
 *                   - test_completed
 *                   - test_abandoned
 *                   - job_viewed
 *                   - job_swiped
 *                   - feedback_submitted
 *                 example: test_started
 *               sessionId:
 *                 type: string
 *                 example: session-uuid
 *               source:
 *                 type: string
 *                 enum: [mobile]
 *                 example: mobile
 *               entityType:
 *                 type: string
 *                 enum: [personality, bilan, work_style, job, feedback]
 *                 example: personality
 *               entityId:
 *                 type: string
 *                 example: personality-v1
 *               stepId:
 *                 type: string
 *                 example: question-4
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 example:
 *                   totalQuestions: 24
 *               occurredAt:
 *                 type: string
 *                 format: date-time
 *               appVersion:
 *                 type: string
 *                 example: 1.0.0
 *     responses:
 *       201:
 *         description: Événement collecté
 *       400:
 *         description: Payload invalide
 *       401:
 *         description: Utilisateur non authentifié
 */
`,

  adminInsightsOverview: `
/**
 * @swagger
 * /api/admin/insights/overview:
 *   get:
 *     summary: Lire les KPI Matcha Insights
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: KPI agrégés du dashboard Insights
 *       401:
 *         description: Admin non authentifié
 */
`,

  adminInsightsActivity: `
/**
 * @swagger
 * /api/admin/insights/activity:
 *   get:
 *     summary: Lire l'activité quotidienne Matcha Insights
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Série quotidienne des événements, utilisateurs actifs et tests terminés
 */
`,

  adminInsightsTests: `
/**
 * @swagger
 * /api/admin/insights/tests:
 *   get:
 *     summary: Lire les taux de completion et d'abandon par test
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Métriques par test avec étape d'abandon principale
 */
`,

  adminInsightsJobs: `
/**
 * @swagger
 * /api/admin/insights/jobs:
 *   get:
 *     summary: Lire les métriques métiers Matcha Insights
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tops métiers, domaines et écart recommandation/intérêt
 */
`,

  adminInsightsOrientation: `
/**
 * @swagger
 * /api/admin/insights/orientation:
 *   get:
 *     summary: Lire les signaux d'orientation Matcha Insights
 *     tags: [Admin, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compétences, valeurs, conditions et profils Style professionnel agrégés
 */
`,
};
