import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import ReservationSchema from '../../schemas/Reservation.model';
import { AuthModule } from '../auth/auth.module';
import { PackageModule } from '../package/package.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Reservation',
				schema: ReservationSchema,
			},
		]),
		AuthModule,
		PackageModule,
	],
	providers: [ReservationResolver, ReservationService],
	exports: [ReservationService],
})
export class ReservationModule {}
