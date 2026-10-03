import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ReservationStatus } from '../../enums/reservation.enum';
import { Member, TotalCounter } from '../member/member';
import { Package } from '../package/package';

@ObjectType()
export class Reservation {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ReservationStatus)
	reservationStatus: ReservationStatus;

	@Field(() => Date)
	reservationDate: Date;

	@Field(() => Number)
	reservationPrice: number;

	@Field(() => String, { nullable: true })
	reservationNote?: string;

	@Field(() => String)
	studioId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	packageId: ObjectId;

	@Field(() => Date, { nullable: true })
	confirmedAt?: Date;

	@Field(() => Date, { nullable: true })
	cancelledAt?: Date;

	@Field(() => Date, { nullable: true })
	completedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Package, { nullable: true })
	packageData?: Package;

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Reservations {
	@Field(() => [Reservation])
	list: Reservation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
