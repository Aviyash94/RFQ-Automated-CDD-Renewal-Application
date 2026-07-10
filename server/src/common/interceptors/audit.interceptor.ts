import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = request.user as AuthUser | undefined;
    const path = request.route?.path || request.url;

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          await this.auditRepo.save({
            actorId: user?.id || null,
            entityType: path.split('/')[3] || 'unknown',
            entityId: request.params?.id || null,
            action: `${method} ${path}`,
            beforeState: request.body ? { body: request.body } : null,
            afterState: responseBody ? { result: 'success' } : null,
            ipAddress: request.ip,
          });
        } catch {
          // Audit failures should not block requests
        }
      }),
    );
  }
}
