import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { ReservationService } from './reservation.service';
import { Reservation, Reservations } from '../../libs/dto/reservation/reservation';
import { ReservationInput, ReservationsInquiry } from '../../libs/dto/reservation/reservation.input';
import { ReservationUpdate } from '../../libs/dto/reservation/reservation.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ReservationResolver {
	constructor(private readonly reservationService: ReservationService) {}

	@Roles(MemberType.USER)
	@UseGuards(RolesGuard)
	@Mutation(() => Reservation)
	public async createReservation(
		@Args('input') input: ReservationInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservation> {
		console.log('Mutation: createReservation');
		input.packageId = shapeIntoMongoObjectId(input.packageId);

		return await this.reservationService.createReservation(memberId, input);
	}

	@Roles(MemberType.USER)
	@UseGuards(RolesGuard)
	@Query(() => Reservations)
	public async getMyReservations(
		@Args('input') input: ReservationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservations> {
		console.log('Query: getMyReservations');

		return await this.reservationService.getMyReservations(memberId, input);
	}

	@Roles(MemberType.STUDIO)
	@UseGuards(RolesGuard)
	@Query(() => Reservations)
	public async getStudioReservations(
		@Args('input') input: ReservationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservations> {
		console.log('Query: getStudioReservations');

		return await this.reservationService.getStudioReservations(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Reservation)
	public async updateReservation(
		@Args('input') input: ReservationUpdate,
		@AuthMember() authMember: Member,
	): Promise<Reservation> {
		console.log('Mutation: updateReservation');
		input._id = shapeIntoMongoObjectId(input._id);

		return await this.reservationService.updateReservation(authMember, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Reservations)
	public async getAllReservationsByAdmin(@Args('input') input: ReservationsInquiry): Promise<Reservations> {
		console.log('Query: getAllReservationsByAdmin');

		return await this.reservationService.getAllReservationsByAdmin(input);
	}
}
