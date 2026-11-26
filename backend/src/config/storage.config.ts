import { registerAs } from '@nestjs/config';
import path from 'node:path';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 'local',
  localDirectory: path.resolve(process.env.STORAGE_LOCAL_DIRECTORY || 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5242880),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}));
