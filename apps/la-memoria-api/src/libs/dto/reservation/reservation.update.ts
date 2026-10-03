import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ReservationStatus } from '../../enums/reservation.enum';

@InputType()
export class ReservationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsNotEmpty()
	@Field(() => ReservationStatus)
	reservationStatus: ReservationStatus;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	reservationNote?: string;

	confirmedAt?: Date;

	cancelledAt?: Date;

	completedAt?: Date;
}
