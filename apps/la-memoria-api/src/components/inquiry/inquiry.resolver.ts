import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { InquiryService } from './inquiry.service';
import { Inquiries, Inquiry } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryUpdate } from '../../libs/dto/inquiry/inquiry.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { WithoutGuard } from '../auth/guards/without.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

/** contact form messages: anyone can send one, admins read and answer them **/
@Resolver()
export class InquiryResolver {
	constructor(private readonly inquiryService: InquiryService) {}

	@UseGuards(WithoutGuard)
	@Mutation((returns) => Inquiry)
	public async createInquiry(
		@Args('input') input: InquiryInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiry> {
		console.log('Mutation: createInquiry');

		return await this.inquiryService.createInquiry(memberId ?? null, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Inquiries)
	public async getAllInquiriesByAdmin(@Args('input') input: AllInquiriesInquiry): Promise<Inquiries> {
		console.log('Query: getAllInquiriesByAdmin');

		return await this.inquiryService.getAllInquiriesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Inquiry)
	public async updateInquiryByAdmin(@Args('input') input: InquiryUpdate): Promise<Inquiry> {
		console.log('Mutation: updateInquiryByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);

		return await this.inquiryService.updateInquiryByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Inquiry)
	public async removeInquiryByAdmin(@Args('inquiryId') input: string): Promise<Inquiry> {
		console.log('Mutation: removeInquiryByAdmin');
		const inquiryId = shapeIntoMongoObjectId(input);

		return await this.inquiryService.removeInquiryByAdmin(inquiryId);
	}
}
