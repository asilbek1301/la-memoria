import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { PackageService } from './package.service';
import { Packages, Package } from '../../libs/dto/package/package';
import {
	StudioPackagesInquiry,
	AllPackagesInquiry,
	OrdinaryInquiry,
	PackagesInquiry,
	PackageInput,
} from '../../libs/dto/package/package.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { PackageUpdate } from '../../libs/dto/package/package.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class PackageResolver {
	constructor(private readonly packageService: PackageService) {}

	@Roles(MemberType.STUDIO)
	@UseGuards(RolesGuard)
	@Mutation(() => Package)
	public async createPackage(
		@Args('input') input: PackageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Package> {
		console.log('Mutation: createPackage');
		input.memberId = memberId;

		return await this.packageService.createPackage(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Package)
	public async getPackage(@Args('packageId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Package> {
		console.log('Query: getPackage');
		const packageId = shapeIntoMongoObjectId(input);

		return await this.packageService.getPackage(memberId, packageId);
	}

	@Roles(MemberType.STUDIO)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Package)
	public async updatePackage(
		@Args('input') input: PackageUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Package> {
		console.log('Mutation: updatePackage');
		input._id = shapeIntoMongoObjectId(input._id);

		return await this.packageService.updatePackage(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Packages)
	public async getPackages(
		@Args('input') input: PackagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Packages> {
		console.log('Query: getPackages');

		return await this.packageService.getPackages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Packages)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Packages> {
		console.log('Query: getFavorites');

		return await this.packageService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Packages)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Packages> {
		console.log('Query: getVisited');

		return await this.packageService.getVisited(memberId, input);
	}

	@Roles(MemberType.STUDIO)
	@UseGuards(RolesGuard)
	@Query((returns) => Packages)
	public async getStudioPackages(
		@Args('input') input: StudioPackagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Packages> {
		console.log('Query: getStudioPackages');

		return await this.packageService.getStudioPackages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Package)
	public async likeTargetPackage(
		@Args('packageId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Package> {
		console.log('Mutation: likeTargetPackage');
		const likeRefId = shapeIntoMongoObjectId(input);

		return await this.packageService.likeTargetPackage(memberId, likeRefId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Packages)
	public async getAllPackagesByAdmin(
		@Args('input') input: AllPackagesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Packages> {
		console.log('Query: getAllPackagesByAdmin');

		return await this.packageService.getAllPackagesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Package)
	public async updatePackageByAdmin(@Args('input') input: PackageUpdate): Promise<Package> {
		console.log('Mutation: updatePackageByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);

		return await this.packageService.updatePackageByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Package)
	public async removePackageByAdmin(@Args('packageId') input: string): Promise<Package> {
		console.log('Mutation: removePackageByAdmin');
		const packageId = shapeIntoMongoObjectId(input);

		return await this.packageService.removePackageByAdmin(packageId);
	}
}
