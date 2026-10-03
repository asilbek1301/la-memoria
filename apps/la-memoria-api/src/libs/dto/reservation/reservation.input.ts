import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ReservationStatus } from '../../enums/reservation.enum';
import { availableReservationSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ReservationInput {
	@IsNotEmpty()
	@Field(() => String)
	packageId: ObjectId;

	@IsNotEmpty()
	@Field(() => Date)
	reservationDate: Date;

	@IsOptional()
	@Length(1, 500)
	@Field(() => String, { nullable: true })
	reservationNote?: string;

	memberId?: ObjectId;

	studioId?: ObjectId;

	reservationPrice?: number;
}

@InputType()
class RISearch {
	@IsOptional()
	@Field(() => ReservationStatus, { nullable: true })
	reservationStatus?: ReservationStatus;
}

@InputType()
export class ReservationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReservationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => RISearch)
	search: RISearch;
}
