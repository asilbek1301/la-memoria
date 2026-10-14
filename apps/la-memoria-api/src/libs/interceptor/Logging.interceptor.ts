import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'graphql') {
			/* (1) Print Request */
			const gqlContext = GqlExecutionContext.create(context);
			this.logger.log(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST');

			/* (2) No Errors, giving Response below */
			return next.handle().pipe(
				tap((response) => {
					const responseTime = Date.now() - recordTime;
					this.logger.log(`${this.stringify(response)} - ${responseTime}ms \n\n`, 'RESPONSE');
				}),
			);
		}

		/* http (REST) and any other request type: pass through */
		return next.handle();
	}

	private stringify(data: any): string {
		return JSON.stringify(data)?.slice(0, 75) ?? '';
	}
}