import { registerEnumType } from '@nestjs/graphql';

export enum ReservationStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
}
registerEnumType(ReservationStatus, {
	name: 'ReservationStatus',
});
