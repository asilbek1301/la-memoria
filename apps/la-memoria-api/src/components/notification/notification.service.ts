import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { NotificationInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupAuthor } from '../../libs/config';

@Injectable()
export class NotificationService {
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	/** called by other services. A notification that fails to save never stops the action that caused it **/
	public async notify(input: NotificationInput): Promise<void> {
		const { notificationType, notificationRefId, authorId, receiverId } = input;
		if (String(authorId) === String(receiverId)) return; // nobody is told about their own action

		try {
			// a like that is taken back and given again tells the owner only once
			if (notificationType === NotificationType.LIKE) {
				const sent = await this.notificationModel.exists({ notificationType, notificationRefId, authorId, receiverId });
				if (sent) return;
			}
			await this.notificationModel.create(input);
		} catch (err) {
			console.log('Error, notify:', err.message);
		}
	}

	public async getNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const result = await this.notificationModel
			.aggregate([
				{ $match: { receiverId: memberId } },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthor,
							{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getUnreadNotifications(memberId: ObjectId): Promise<number> {
		return await this.notificationModel
			.countDocuments({ receiverId: memberId, notificationStatus: NotificationStatus.WAIT })
			.exec();
	}

	public async readNotification(memberId: ObjectId, notificationId: ObjectId): Promise<Notification> {
		const result = await this.notificationModel
			.findOneAndUpdate(
				{ _id: notificationId, receiverId: memberId },
				{ notificationStatus: NotificationStatus.READ },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	/** returns how many were marked **/
	public async readAllNotifications(memberId: ObjectId): Promise<number> {
		const result = await this.notificationModel
			.updateMany(
				{ receiverId: memberId, notificationStatus: NotificationStatus.WAIT },
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();

		return result.modifiedCount;
	}
}
