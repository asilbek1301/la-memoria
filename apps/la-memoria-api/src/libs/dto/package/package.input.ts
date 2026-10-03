import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { PackageLocation, PackageStatus, PackageStyle, PackageType } from '../../enums/package.enum';
import type { ObjectId } from 'mongoose';
import { availableOptions, availablePackageSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PackageInput {
	@IsNotEmpty()
	@Field(() => PackageType)
	packageType: PackageType;

	@IsNotEmpty()
	@Field(() => PackageStyle)
	packageStyle: PackageStyle;

	@IsNotEmpty()
	@Field(() => PackageLocation)
	packageLocation: PackageLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	packageAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	packageTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	packagePrice: number;

	@IsNotEmpty()
	@Field(() => Number)
	packageDuration: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	packagePhotos: number;

	@IsNotEmpty()
	@Field(() => [String])
	packageImages: string[];

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

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class DurationsRange {
	@Field(() => Number)
	start: number;

	@Field(() => Number)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [PackageLocation], { nullable: true })
	locationList?: PackageLocation[];

	@IsOptional()
	@Field(() => [PackageType], { nullable: true })
	typeList?: PackageType[];

	@IsOptional()
	@Field(() => [PackageStyle], { nullable: true })
	styleList?: PackageStyle[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	photosList?: Number[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	options?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => DurationsRange, { nullable: true })
	durationsRange?: DurationsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class PackagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePackageSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
class SPISearch {
	@IsOptional()
	@Field(() => PackageStatus, { nullable: true })
	packageStatus?: PackageStatus;
}

@InputType()
export class StudioPackagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePackageSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => SPISearch)
	search: SPISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => PackageStatus, { nullable: true })
	packageStatus?: PackageStatus;

	@IsOptional()
	@Field(() => [PackageLocation], { nullable: true })
	packageLocationList?: PackageLocation[];
}

@InputType()
export class AllPackagesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePackageSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
