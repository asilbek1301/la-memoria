import { Schema } from 'mongoose';
import { InquiryStatus } from '../libs/enums/inquiry.enum';

/** a message sent from the contact form (Help page and homepage); read by admins in the 1:1 Inquiry page **/
const InquirySchema = new Schema(
	{
		inquiryStatus: {
			type: String,
			enum: InquiryStatus,
			default: InquiryStatus.NEW,
		},

		inquiryName: {
			type: String,
			required: true,
		},

		inquiryEmail: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},

		inquiryMessage: {
			type: String,
			required: true,
		},

		// set when the sender was logged in
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'inquiries' },
);

InquirySchema.index({ inquiryEmail: 1, createdAt: -1 });

export default InquirySchema;
