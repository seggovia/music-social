import type { ErrorRequestHandler } from 'express';
import { AppError, defaultErrorCode } from '../errors/AppError.js';

const DEFAULT_MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Revisa los datos e intenta de nuevo.',
  401: 'Inicia sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'Hay un conflicto con esta acción.',
  500: 'Algo salió mal, intenta de nuevo.',
};

const MESSAGE_OVERRIDES: Record<string, string> = {
  'Artist not found in MusicBrainz': 'No encontramos ese artista.',
  'Authentication required': 'Inicia sesión para continuar.',
  'Authentication token missing': 'Inicia sesión para continuar.',
  'Invalid or expired token': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Invalid email or password': 'El correo o la contraseña no son correctos.',
  'User profile not found': 'No encontramos tu perfil.',
  'User not found': 'No encontramos ese usuario.',
  'Not authorized': 'No tienes permiso para realizar esta acción.',
  'Not authorized to edit this profile': 'No tienes permiso para editar este perfil.',
  'You cannot follow yourself': 'No puedes seguirte a ti mismo.',
  'You already follow this user': 'Ya sigues a este usuario.',
  'Rating must be between 0.5 and 5': 'La calificación debe estar entre 0.5 y 5.',
  'Review content cannot be empty': 'Escribe una reseña antes de enviarla.',
  'Album not found': 'No encontramos ese álbum.',
  'Review not found': 'No encontramos esa reseña.',
  'You have already reviewed this album': 'Ya escribiste una reseña para este álbum.',
  'Review comment cannot be empty': 'Escribe un comentario antes de enviarlo.',
  'Review comment is too long': 'El comentario no puede superar los 2000 caracteres.',
  'Review comment not found': 'No encontramos ese comentario.',
  'Not authorized to delete this comment': 'Solo puedes borrar tus propios comentarios.',
  'Message body cannot be empty': 'Escribe un mensaje antes de enviarlo.',
  'Message not found': 'No encontramos ese mensaje.',
  'You can only edit your own messages': 'Solo puedes editar tus propios mensajes.',
  'Message can no longer be edited': 'Ya no puedes editar este mensaje.',
  'Invalid message delete mode': 'Elige una opcion valida para anular el envio.',
  'Only the sender can delete the message': 'Solo quien envio el mensaje puede anularlo.',
  'Only the sender can delete the message for everyone': 'Solo quien envió el mensaje puede anularlo para todos.',
  'Message can no longer be deleted for everyone': 'Ya no puedes anular este mensaje para todos.',
  'Maximum 2 pinned messages per conversation': 'Solo puedes fijar hasta 2 mensajes por conversación.',
  'Route not found': 'No encontramos lo que buscas.',
};

function getStatus(err: unknown) {
  if (err instanceof AppError) return err.status;
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number' && status >= 400 && status < 600) return status;
  }
  return 500;
}

function getMessage(err: unknown, status: number) {
  if (status >= 500) return DEFAULT_MESSAGE_BY_STATUS[500];

  const original = err instanceof Error ? err.message : undefined;
  if (!original) return DEFAULT_MESSAGE_BY_STATUS[status] ?? DEFAULT_MESSAGE_BY_STATUS[400];

  if (MESSAGE_OVERRIDES[original]) return MESSAGE_OVERRIDES[original];
  if (original.includes('must be a valid URL starting with http(s)://')) {
    return 'Ingresa una URL válida que empiece con http:// o https://.';
  }

  return DEFAULT_MESSAGE_BY_STATUS[status] ?? DEFAULT_MESSAGE_BY_STATUS[400];
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = getStatus(err);
  const code = err instanceof AppError ? err.code : defaultErrorCode(status);

  res.status(status).json({
    error: {
      message: getMessage(err, status),
      code,
    },
  });
};
