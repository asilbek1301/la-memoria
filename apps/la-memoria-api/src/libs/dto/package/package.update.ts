import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { PackageLocation, PackageStatus, PackageStyle, PackageType } from '../../enums/package.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class PackageUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => PackageType, { nullable: true })
	packageType?: PackageType;

	@IsOptional()
	@Field(() => PackageStatus, { nullable: true })
	packageStatus?: PackageStatus;

	@IsOptional()
	@Field(() => PackageStyle, { nullable: true })
	packageStyle?: PackageStyle;

	@IsOptional()
	@Field(() => PackageLocation, { nullable: true })
	packageLocation?: PackageLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	packageAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	packageTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	packagePrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	packageDuration?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	packagePhotos?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	packageImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	packageDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	packageAlbum?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	packageDress?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	packageMakeup?: boolean;

	pausedAt?: Date;

	deletedAt?: Date;
}
