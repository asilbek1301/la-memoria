import { registerEnumType } from '@nestjs/graphql';

export enum PackageType {
	PEARL = 'PEARL',
	GOLD = 'GOLD',
	DIAMOND = 'DIAMOND',
}
registerEnumType(PackageType, {
	name: 'PackageType',
});

export enum PackageStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	PAUSE = 'PAUSE',
	DELETE = 'DELETE',
}
registerEnumType(PackageStatus, {
	name: 'PackageStatus',
});

export enum PackageStyle {
	CLASSIC = 'CLASSIC',
	MODERN = 'MODERN',
	VINTAGE = 'VINTAGE',
	ROMANTIC = 'ROMANTIC',
}
registerEnumType(PackageStyle, {
	name: 'PackageStyle',
});

export enum PackageLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(PackageLocation, {
	name: 'PackageLocation',
});
