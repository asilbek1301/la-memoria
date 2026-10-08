import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import moment from 'moment';
import { Reservation, Reservations } from '../../libs/dto/reservation/reservation';
import { ReservationInput, ReservationsInquiry } from '../../libs/dto/reservation/reservation.input';
import { ReservationUpdate } from '../../libs/dto/reservation/reservation.update';
import { Member } from '../../libs/dto/member/member';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { ReservationStatus } from '../../libs/enums/reservation.enum';
import { T } from '../../libs/types/common';
import { lookupMember, lookupPackage } from '../../libs/config';
import { PackageService } from '../package/package.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

/** allowed status transitions: current status -> next statuses **/
export const reservationTransitions: Record<ReservationStatus, ReservationStatus[]> = {
	[ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
	[ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
	[ReservationStatus.CANCELLED]: [],
	[ReservationStatus.COMPLETED]: [],
};

/** a reservation's day as people say it, e.g. "12 Oct 2026" **/
const reservationDay = (date: Date) => moment(date).format('D MMM YYYY');

/** the notification each status change sends (nothing ever moves back to PENDING) **/
interface StatusNotification {
	type: NotificationType;
	title: (day: string) => string;
}
const statusNotifications: Partial<Record<ReservationStatus, StatusNotification>> = {
	[ReservationStatus.CONFIRMED]: {
		type: NotificationType.CONFIRMED,
		title: (day) => `confirmed your reservation for ${day}`,
	},
	[ReservationStatus.COMPLETED]: {
		type: NotificationType.COMPLETED,
		title: (day) => `marked your reservation for ${day} as completed`,
	},
	[ReservationStatus.CANCELLED]: {
		type: NotificationType.CANCELLED,
		title: (day) => `cancelled the reservation for ${day}`,
	},
};

@Injectable()
export class ReservationService {
	constructor(
		@InjectModel('Reservation') private readonly reservationModel: Model<Reservation>,
		private readonly packageService: PackageService,
		private readonly notificationService: NotificationService,
	) {}

	public async createReservation(memberId: ObjectId, input: ReservationInput): Promise<Reservation> {
		if (moment(input.reservationDate).isBefore(moment())) throw new BadRequestException(Message.BAD_REQUEST);

		const targetPackage = await this.packageService.getActivePackage(input.packageId);
		input.memberId = memberId;
		input.studioId = targetPackage.memberId;
		input.reservationPrice = targetPackage.packagePrice;

		try {
			const result = await this.reservationModel.create(input);
			await this.packageService.packageStatsEditor({
				_id: targetPackage._id,
				targetKey: 'packageReservations',
				modifier: 1,
			});
			await this.notificationService.notify({
				notificationType: NotificationType.REQUESTED,
				notificationGroup: NotificationGroup.RESERVATION,
				notificationTitle: `requested "${targetPackage.packageTitle}" for ${reservationDay(result.reservationDate)}`,
				notificationRefId: result._id,
				authorId: memberId,
				receiverId: targetPackage.memberId,
			});

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyReservations(memberId: ObjectId, input: ReservationsInquiry): Promise<Reservations> {
		const match: T = { memberId: memberId };
		return await this.getReservationList(match, input);
	}

	public async getStudioReservations(studioId: ObjectId, input: ReservationsInquiry): Promise<Reservations> {
		const match: T = { studioId: studioId };
		return await this.getReservationList(match, input);
	}

	public async getAllReservationsByAdmin(input: ReservationsInquiry): Promise<Reservations> {
		return await this.getReservationList({}, input);
	}

	public async updateReservation(authMember: Member, input: ReservationUpdate): Promise<Reservation> {
		const target: Reservation | null = await this.reservationModel.findOne({ _id: input._id }).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		this.checkReservationUpdate(authMember, target, input.reservationStatus);

		const { reservationStatus } = input;
		if (reservationStatus === ReservationStatus.CONFIRMED) input.confirmedAt = moment().toDate();
		else if (reservationStatus === ReservationStatus.COMPLETED) input.completedAt = moment().toDate();
		else if (reservationStatus === ReservationStatus.CANCELLED) input.cancelledAt = moment().toDate();

		const result = await this.reservationModel
			.findOneAndUpdate({ _id: input._id, reservationStatus: target.reservationStatus }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (reservationStatus === ReservationStatus.CANCELLED) {
			await this.packageService.packageStatsEditor({
				_id: target.packageId,
				targetKey: 'packageReservations',
				modifier: -1,
			});
		}

		// whoever changed the reservation tells the other side: the studio tells the couple, the couple tells the studio
		const note = statusNotifications[reservationStatus];
		const byStudio = String(authMember._id) === String(target.studioId);
		if (note) {
			await this.notificationService.notify({
				notificationType: note.type,
				notificationGroup: NotificationGroup.RESERVATION,
				notificationTitle: note.title(reservationDay(target.reservationDate)),
				notificationRefId: target._id,
				authorId: authMember._id,
				receiverId: byStudio ? target.memberId : target.studioId,
			});
		}

		return result;
	}

	/** studio owner confirms/completes; studio owner or couple can cancel **/
	public checkReservationUpdate(authMember: Member, target: Reservation, nextStatus: ReservationStatus): void {
		if (!reservationTransitions[target.reservationStatus].includes(nextStatus)) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}

		const memberId = String(authMember._id);
		const isStudio = authMember.memberType === MemberType.STUDIO && String(target.studioId) === memberId;
		const isCouple = String(target.memberId) === memberId;

		const allowed = nextStatus === ReservationStatus.CANCELLED ? isStudio || isCouple : isStudio;
		if (!allowed) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	private async getReservationList(match: T, input: ReservationsInquiry): Promise<Reservations> {
		const { reservationStatus } = input.search;
		if (reservationStatus) match.reservationStatus = reservationStatus;
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.reservationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupPackage,
							{ $unwind: { path: '$packageData', preserveNullAndEmptyArrays: true } },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
