import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { NotificationGroup, NotificationType } from '../../enums/notification.enum';

/** written by other services (reservations, likes), never sent by the client **/
export interface NotificationInput {
	notificationType: NotificationType;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	notificationRefId: ObjectId;
	authorId: ObjectId;
	receiverId: ObjectId;
}

/** the logged-in member's notifications, newest first **/
@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(50)
	@Field(() => Int)
	limit: number;
}
