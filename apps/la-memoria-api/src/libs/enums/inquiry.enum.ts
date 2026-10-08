import { registerEnumType } from '@nestjs/graphql';

export enum InquiryStatus {
	NEW = 'NEW',
	ANSWERED = 'ANSWERED',
	DELETE = 'DELETE',
}
registerEnumType(InquiryStatus, {
	name: 'InquiryStatus',
});
