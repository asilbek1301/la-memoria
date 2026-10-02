import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class ViewInput {
	@IsNotEmpty()
	@Field(() => ViewGroup) // GraphQL
	viewGroup: string; // TypeScript

	@IsNotEmpty()
	@Field(() => ViewGroup)
	viewRefId: ObjectId;

	@IsNotEmpty()
	@Field(() => ViewGroup)
	memberId: ObjectId;
}
