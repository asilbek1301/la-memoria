import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

/** the header bell: every query works on the logged-in member's own notifications **/
@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getNotifications');

		return await this.notificationService.getNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadNotifications(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Query: getUnreadNotifications');

		return await this.notificationService.getUnreadNotifications(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async readNotification(
		@Args('notificationId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: readNotification');
		const notificationId = shapeIntoMongoObjectId(input);

		return await this.notificationService.readNotification(memberId, notificationId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async readAllNotifications(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Mutation: readAllNotifications');

		return await this.notificationService.readAllNotifications(memberId);
	}
}
