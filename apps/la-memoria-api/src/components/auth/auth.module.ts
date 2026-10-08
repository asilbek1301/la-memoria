import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [
		HttpModule,
		// read the secret when the module starts, after ConfigModule has loaded .env (reading it at import time gave the
		// string "undefined", so anyone could sign a valid token); no secret means the server must not start
		JwtModule.registerAsync({
			useFactory: () => {
				const secret = process.env.SECRET_TOKEN;
				if (!secret) throw new Error('SECRET_TOKEN is missing in .env');
				return { secret, signOptions: { expiresIn: '30d' } };
			},
		}),
	],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
