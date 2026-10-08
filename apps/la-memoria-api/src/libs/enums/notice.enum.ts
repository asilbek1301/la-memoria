import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	NOTICE = 'NOTICE',
	FAQ = 'FAQ',
	TERMS = 'TERMS',
	INQUIRY = 'INQUIRY',
}
registerEnumType(NoticeCategory, {
	name: 'NoticeCategory',
});

export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, {
	name: 'NoticeStatus',
});

/** FAQ topics on the Help page **/
export enum NoticeTopic {
	PACKAGES = 'PACKAGES',
	RESERVATIONS = 'RESERVATIONS',
	PAYMENTS = 'PAYMENTS',
	STUDIOS = 'STUDIOS',
	COMMUNITY = 'COMMUNITY',
}
registerEnumType(NoticeTopic, {
	name: 'NoticeTopic',
});
