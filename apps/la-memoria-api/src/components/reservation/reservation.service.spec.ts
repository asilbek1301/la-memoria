import { BadRequestException } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationStatus } from '../../libs/enums/reservation.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { Member } from '../../libs/dto/member/member';
import { Reservation } from '../../libs/dto/reservation/reservation';

describe('ReservationService.checkReservationUpdate', () => {
	const service = new ReservationService({} as any, {} as any);

	const studio = { _id: 'studio-1', memberType: MemberType.STUDIO } as unknown as Member;
	const otherStudio = { _id: 'studio-2', memberType: MemberType.STUDIO } as unknown as Member;
	const couple = { _id: 'user-1', memberType: MemberType.USER } as unknown as Member;

	const reservation = (status: ReservationStatus) =>
		({ reservationStatus: status, studioId: 'studio-1', memberId: 'user-1' }) as unknown as Reservation;

	it('lets the owning studio confirm and complete', () => {
		expect(() =>
			service.checkReservationUpdate(studio, reservation(ReservationStatus.PENDING), ReservationStatus.CONFIRMED),
		).not.toThrow();
		expect(() =>
			service.checkReservationUpdate(studio, reservation(ReservationStatus.CONFIRMED), ReservationStatus.COMPLETED),
		).not.toThrow();
	});

	it('lets the couple or the studio cancel', () => {
		expect(() =>
			service.checkReservationUpdate(couple, reservation(ReservationStatus.PENDING), ReservationStatus.CANCELLED),
		).not.toThrow();
		expect(() =>
			service.checkReservationUpdate(studio, reservation(ReservationStatus.CONFIRMED), ReservationStatus.CANCELLED),
		).not.toThrow();
	});

	it('rejects the couple confirming and other studios touching the reservation', () => {
		expect(() =>
			service.checkReservationUpdate(couple, reservation(ReservationStatus.PENDING), ReservationStatus.CONFIRMED),
		).toThrow(BadRequestException);
		expect(() =>
			service.checkReservationUpdate(otherStudio, reservation(ReservationStatus.PENDING), ReservationStatus.CANCELLED),
		).toThrow(BadRequestException);
	});

	it('rejects invalid transitions', () => {
		expect(() =>
			service.checkReservationUpdate(studio, reservation(ReservationStatus.PENDING), ReservationStatus.COMPLETED),
		).toThrow(BadRequestException);
		expect(() =>
			service.checkReservationUpdate(studio, reservation(ReservationStatus.CANCELLED), ReservationStatus.CONFIRMED),
		).toThrow(BadRequestException);
		expect(() =>
			service.checkReservationUpdate(couple, reservation(ReservationStatus.COMPLETED), ReservationStatus.CANCELLED),
		).toThrow(BadRequestException);
	});
});
