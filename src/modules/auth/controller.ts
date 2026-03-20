import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '@/config/env';
import User from '@/models/User';
import { sendResetPasswordEmail } from '@/services/notifications/email';
import { RequestPasswordResetInput, ResetPasswordInput } from '@/types/user';

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (
  req: Request<object, object, LoginRequest>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          'Please verify your email address before logging in. Check your inbox for the verification link.',
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const requestPasswordReset = async (
  req: Request<object, object, RequestPasswordResetInput>,
  res: Response
): Promise<Response | void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Ne pas révéler si l'email existe ou non → sécurité
      res
        .status(200)
        .json({ message: 'If this email exists, a reset link has been sent.' });
      return;
    }

    // Génère un token brut (envoyé par email)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Enregistre le hash et une date d'expiration (15 min)
    user.resetPasswordTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Envoie du mail avec le token brut
    await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({
      message: 'If this email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (
  req: Request<object, object, ResetPasswordInput>,
  res: Response
): Promise<Response | void> => {
  const { token, newPassword } = req.body;

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Hash du nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Mise à jour + suppression du token
    user.passwordHash = newPasswordHash;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const HTML_STYLES = `
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      color: #333;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 500px;
    }
    h1 { color: #667eea; margin-bottom: 20px; }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px;
      font-weight: bold;
    }
    .button:hover { opacity: 0.9; }
    .instructions {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #ddd;
      font-size: 14px;
      color: #666;
    }
  </style>
`;

const renderErrorPage = (): string => `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token manquant</title>
    ${HTML_STYLES}
  </head>
  <body>
    <div class="container">
      <h1>❌ Token manquant</h1>
      <p>Le lien de réinitialisation est invalide.</p>
      <p>Veuillez demander un nouveau lien depuis l'application.</p>
    </div>
  </body>
  </html>
`;

const renderRedirectPage = (
  token: string,
  deepLink: string,
  expLink: string
): string => `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirection vers Matcha</title>
    ${HTML_STYLES}
    <script>
      function redirectToApp() {
        window.location.href = '${deepLink}';

        setTimeout(() => {
          document.getElementById('message').innerHTML =
            'Tentative de redirection avec Expo Go...';
          window.location.href = '${expLink}';
        }, 2000);

        setTimeout(() => {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('manual').style.display = 'block';
        }, 5000);
      }

      window.onload = redirectToApp;
    </script>
  </head>
  <body>
    <div class="container">
      <h1>🔄 Redirection en cours...</h1>

      <div id="loading">
        <div class="spinner"></div>
        <p id="message">Ouverture de l'application Matcha...</p>
      </div>

      <div id="manual" style="display: none;">
        <p><strong>L'application ne s'est pas ouverte automatiquement ?</strong></p>
        <p>Cliquez sur l'un des boutons ci-dessous :</p>

        <a href="${deepLink}" class="button">Ouvrir Matcha</a>
        <a href="${expLink}" class="button">Ouvrir avec Expo Go</a>

        <div class="instructions">
          <p><strong>Instructions :</strong></p>
          <ol style="text-align: left;">
            <li>Si vous avez installé l'application Matcha, utilisez le premier bouton</li>
            <li>Si vous utilisez Expo Go pour le développement, utilisez le second bouton</li>
            <li>Si aucun ne fonctionne, copiez le token et collez-le manuellement dans l'application</li>
          </ol>
          <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
            <strong>Token:</strong> ${token}
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

export const redirectToApp = (req: Request, res: Response): void => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).send(renderErrorPage());
    return;
  }

  const deepLink = `matcha://reset-password?token=${token}`;
  const expLink = `exp://192.168.1.1:8081/--/reset-password?token=${token}`;

  res.send(renderRedirectPage(token, deepLink, expLink));
};
