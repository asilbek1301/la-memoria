import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PACKAGE = 'PACKAGE',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
