import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Inquiry {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => InquiryStatus)
	inquiryStatus: InquiryStatus;

	@Field(() => String)
	inquiryName: string;

	@Field(() => String)
	inquiryEmail: string;

	@Field(() => String)
	inquiryMessage: string;

	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Inquiries {
	@Field(() => [Inquiry])
	list: Inquiry[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
