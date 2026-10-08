import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Inquiries, Inquiry } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdate } from '../../libs/dto/inquiry/inquiry.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { InquiryStatus } from '../../libs/enums/inquiry.enum';
import { T } from '../../libs/types/common';

// a light guard against repeated sends: at most this many messages per email address in the window
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class InquiryService {
	constructor(@InjectModel('Inquiry') private readonly inquiryModel: Model<Inquiry>) {}

	/** PUBLIC **/

	public async createInquiry(memberId: ObjectId | null, input: InquiryInput): Promise<Inquiry> {
		const inquiryEmail = input.inquiryEmail.trim().toLowerCase();
		const recent = await this.inquiryModel
			.countDocuments({ inquiryEmail, createdAt: { $gte: new Date(Date.now() - WINDOW_MS) } })
			.exec();
		if (recent >= MAX_PER_WINDOW) throw new BadRequestException(Message.TOO_MANY_INQUIRIES);

		try {
			return await this.inquiryModel.create({
				inquiryName: input.inquiryName.trim(),
				inquiryEmail,
				inquiryMessage: input.inquiryMessage.trim(),
				...(memberId ? { memberId } : {}),
			});
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	/** ADMIN **/

	public async getAllInquiriesByAdmin(input: AllInquiriesInquiry): Promise<Inquiries> {
		const match: T = {};
		if (input.search?.inquiryStatus) match.inquiryStatus = input.search.inquiryStatus;

		const result = await this.inquiryModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC, _id: -1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateInquiryByAdmin(input: InquiryUpdate): Promise<Inquiry> {
		const result = await this.inquiryModel
			.findOneAndUpdate({ _id: input._id }, { inquiryStatus: input.inquiryStatus }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	/** only a message already marked DELETE can be removed for good **/
	public async removeInquiryByAdmin(inquiryId: ObjectId): Promise<Inquiry> {
		const result = await this.inquiryModel
			.findOneAndDelete({ _id: inquiryId, inquiryStatus: InquiryStatus.DELETE })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
