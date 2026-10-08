import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	REQUESTED = 'REQUESTED',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	PACKAGE = 'PACKAGE',
	RESERVATION = 'RESERVATION',
	ARTICLE = 'ARTICLE',
	NOTICE = 'NOTICE',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
