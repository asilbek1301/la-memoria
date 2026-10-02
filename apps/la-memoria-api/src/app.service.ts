import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getHello(): string {
		return 'Welcome to La Memoria GraphQL API server!';
	}
}
