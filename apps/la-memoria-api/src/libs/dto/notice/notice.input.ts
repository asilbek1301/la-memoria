import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { NoticeCategory, NoticeStatus, NoticeTopic } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';
import { availableNoticeSorts } from '../../config';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeTopic, { nullable: true })
	noticeTopic?: NoticeTopic;

	@IsNotEmpty()
	@Length(3, 150)
	@Field(() => String)
	noticeTitle: string;

	@IsNotEmpty()
	@Length(3, 3000)
	@Field(() => String)
	noticeContent: string;

	memberId?: ObjectId;
}

@InputType()
class NISearch {
	@IsNotEmpty()
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeTopic, { nullable: true })
	noticeTopic?: NoticeTopic;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

/** public: active items of one category (FAQ oldest first, notices newest first) **/
@InputType()
export class NoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => NISearch)
	search: NISearch;
}

@InputType()
class ANISearch {
	@IsOptional()
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Field(() => NoticeTopic, { nullable: true })
	noticeTopic?: NoticeTopic;
}

@InputType()
export class AllNoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableNoticeSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ANISearch)
	search: ANISearch;
}
