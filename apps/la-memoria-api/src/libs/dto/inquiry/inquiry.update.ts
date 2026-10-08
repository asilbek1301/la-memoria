import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';

@InputType()
export class InquiryUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsNotEmpty()
	@Field(() => InquiryStatus)
	inquiryStatus: InquiryStatus;
}
