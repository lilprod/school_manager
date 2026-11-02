import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { stripSecrets } from './strip-secrets.js';

/** Filet de sécurité : aucune réponse JSON ne doit contenir de hash de mot de passe. */
@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => stripSecrets(data)));
  }
}
