import { existsSync } from 'fs';
import { basename, isAbsolute, join, resolve } from 'path';

export function getUploadDir(uploadDirConfig = './uploads'): string {
  return isAbsolute(uploadDirConfig)
    ? uploadDirConfig
    : resolve(process.cwd(), uploadDirConfig);
}

/** Normalize multer output to `uploads/<filename>`. */
export function normalizeStoragePath(filePath: string): string {
  const absolute = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  return join('uploads', basename(absolute)).replace(/\\/g, '/');
}

export function resolveStoragePath(
  storagePath: string,
  uploadDirConfig = './uploads',
): string {
  const normalized = storagePath.replace(/\\/g, '/');

  if (isAbsolute(normalized)) {
    return normalized;
  }

  const fromCwd = resolve(process.cwd(), normalized);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }

  const fromUploadDir = join(getUploadDir(uploadDirConfig), basename(normalized));
  if (existsSync(fromUploadDir)) {
    return fromUploadDir;
  }

  return fromCwd;
}
