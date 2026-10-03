import { Schema } from 'mongoose';
import { ReservationStatus } from '../libs/enums/reservation.enum';

const ReservationSchema = new Schema(
	{
		reservationStatus: {
			type: String,
			enum: ReservationStatus,
			default: ReservationStatus.PENDING,
		},

		reservationDate: {
			type: Date,
			required: true,
		},

		reservationPrice: {
			type: Number,
			required: true,
		},

		reservationNote: {
			type: String,
		},

		studioId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		packageId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Package',
		},

		confirmedAt: {
			type: Date,
		},

		cancelledAt: {
			type: Date,
		},

		completedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'reservations' },
);

ReservationSchema.index({ packageId: 1, memberId: 1, reservationDate: 1 }, { unique: true });

export default ReservationSchema;
