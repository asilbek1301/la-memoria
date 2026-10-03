import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { PackageLocation, PackageStatus, PackageStyle, PackageType } from '../../enums/package.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Package {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => PackageType)
	packageType: PackageType;

	@Field(() => PackageStatus)
	packageStatus: PackageStatus;

	@Field(() => PackageStyle)
	packageStyle: PackageStyle;

	@Field(() => PackageLocation)
	packageLocation: PackageLocation;

	@Field(() => String)
	packageAddress: string;

	@Field(() => String)
	packageTitle: string;

	@Field(() => Number)
	packagePrice: number;

	@Field(() => Number)
	packageDuration: number;

	@Field(() => Int)
	packagePhotos: number;

	@Field(() => Int)
	packageViews: number;

	@Field(() => Int)
	packageLikes: number;

	@Field(() => Int)
	packageComments: number;

	@Field(() => Int)
	packageReservations: number;

	@Field(() => Int)
	packageRank: number;

	@Field(() => [String])
	packageImages: string[];

	@Field(() => String, { nullable: true })
	packageDesc?: string;

	@Field(() => Boolean)
	packageAlbum: boolean;

	@Field(() => Boolean)
	packageDress: boolean;

	@Field(() => Boolean)
	packageMakeup: boolean;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	pausedAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Packages {
	@Field(() => [Package])
	list: Package[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
