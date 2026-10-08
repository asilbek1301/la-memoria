import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notice.enum';
import { T } from '../../libs/types/common';

/** a search text used as plain text inside a regular expression **/
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	/** PUBLIC **/

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeTopic, text } = input.search;
		const match: T = { noticeStatus: NoticeStatus.ACTIVE, noticeCategory };
		if (noticeTopic) match.noticeTopic = noticeTopic;
		if (text?.trim()) {
			const pattern = new RegExp(escapeRegex(text.trim()), 'i');
			match.$or = [{ noticeTitle: pattern }, { noticeContent: pattern }];
		}
		// FAQ reads in the order it was written; notices show the newest first
		const sort: T = { createdAt: noticeCategory === NoticeCategory.FAQ ? Direction.ASC : Direction.DESC };

		return await this.listNotices(match, sort, input.page, input.limit);
	}

	/** ADMIN **/

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		input.memberId = memberId;
		try {
			return await this.noticeModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeStatus, noticeTopic } = input.search;
		const match: T = {};
		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;
		if (noticeTopic) match.noticeTopic = noticeTopic;
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		return await this.listNotices(match, sort, input.page, input.limit);
	}

	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const { _id, ...rest } = input;
		const result = await this.noticeModel.findOneAndUpdate({ _id }, rest, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	/** only an item already marked DELETE can be removed for good **/
	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const search: T = { _id: noticeId, noticeStatus: NoticeStatus.DELETE };
		const result = await this.noticeModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	private async listNotices(match: T, sort: T, page: number, limit: number): Promise<Notices> {
		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: { ...sort, _id: 1 } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
