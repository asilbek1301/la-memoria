import mongoose, { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus, NoticeTopic } from '../libs/enums/notice.enum';

const NoticeSchema = new Schema(
	{
		noticeCategory: {
			type: String,
			enum: NoticeCategory,
			required: true,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
		},

		// FAQ only: which Help topic the question belongs to
		noticeTopic: {
			type: String,
			enum: NoticeTopic,
		},

		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},
		
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'notices' },
);

export default NoticeSchema;
