import { Schema } from 'mongoose';
import { PackageLocation, PackageStatus, PackageStyle, PackageType } from '../libs/enums/package.enum';

const PackageSchema = new Schema(
	{
		packageType: {
			type: String,
			enum: PackageType,
			required: true,
		},

		packageStatus: {
			type: String,
			enum: PackageStatus,
			default: PackageStatus.ACTIVE,
		},

		packageStyle: {
			type: String,
			enum: PackageStyle,
			required: true,
		},

		packageLocation: {
			type: String,
			enum: PackageLocation,
			required: true,
		},

		packageAddress: {
			type: String,
			required: true,
		},

		packageTitle: {
			type: String,
			required: true,
		},

		packagePrice: {
			type: Number,
			required: true,
		},

		packageDuration: {
			type: Number,
			required: true,
		},

		packagePhotos: {
			type: Number,
			required: true,
		},

		packageViews: {
			type: Number,
			default: 0,
		},

		packageLikes: {
			type: Number,
			default: 0,
		},

		packageComments: {
			type: Number,
			default: 0,
		},

		packageReservations: {
			type: Number,
			default: 0,
		},

		packageRank: {
			type: Number,
			default: 0,
		},

		packageImages: {
			type: [String],
			required: true,
		},

		packageDesc: {
			type: String,
		},

		packageAlbum: {
			type: Boolean,
			default: false,
		},

		packageDress: {
			type: Boolean,
			default: false,
		},

		packageMakeup: {
			type: Boolean,
			default: false,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		pausedAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'packages' },
);

PackageSchema.index({ packageType: 1, packageLocation: 1, packageTitle: 1, packagePrice: 1 }, { unique: true });

export default PackageSchema;
