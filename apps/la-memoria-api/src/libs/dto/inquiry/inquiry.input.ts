import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, Length, MaxLength, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { InquiryStatus } from '../../enums/inquiry.enum';

@InputType()
export class InquiryInput {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	inquiryName: string;

	@IsNotEmpty()
	@IsEmail()
	@MaxLength(100)
	@Field(() => String)
	inquiryEmail: string;

	@IsNotEmpty()
	@Length(10, 2000)
	@Field(() => String)
	inquiryMessage: string;

	memberId?: ObjectId;
}

@InputType()
class AIISearch {
	@IsOptional()
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
}

@InputType()
export class AllInquiriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => AIISearch)
	search: AIISearch;
}
