import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/la-memoria-api/src/libs/dto/member/member';
import { Packages, Package } from 'apps/la-memoria-api/src/libs/dto/package/package';
import { MemberStatus, MemberType } from 'apps/la-memoria-api/src/libs/enums/member.enum';
import { PackageStatus } from 'apps/la-memoria-api/src/libs/enums/package.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Package') private readonly packageModel: Model<Package>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.packageModel
			.updateMany(
				{
					packageStatus: PackageStatus.ACTIVE,
				},
				{ packageRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberType: MemberType.STUDIO,
					memberStatus: MemberStatus.ACTIVE,
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	public async batchTopPackages(): Promise<void> {
		const packages: Package[] = await this.packageModel
			.find({
				packageStatus: PackageStatus.ACTIVE,
				packageRank: 0,
			})
			.exec();

		const promisedList = packages.map(async (ele: Package) => {
			const { _id, packageLikes, packageViews } = ele;
			const rank = packageLikes * 2 + packageViews * 1;
			return await this.packageModel.findByIdAndUpdate(_id, { packageRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopStudios(): Promise<void> {
		const studios: Member[] = await this.memberModel
			.find({
				memberType: MemberType.STUDIO,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = studios.map(async (ele: Member) => {
			const { _id, memberPackages, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberPackages * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to La Memoria BATCH API server!';
	}
}
