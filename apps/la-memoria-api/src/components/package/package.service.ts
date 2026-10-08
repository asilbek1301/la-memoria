import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Packages, Package } from '../../libs/dto/package/package';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	StudioPackagesInquiry,
	AllPackagesInquiry,
	OrdinaryInquiry,
	PackagesInquiry,
	PackageInput,
} from '../../libs/dto/package/package.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { PackageStatus } from '../../libs/enums/package.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { PackageUpdate } from '../../libs/dto/package/package.update';
import moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class PackageService {
	constructor(
		@InjectModel('Package') private readonly packageModel: Model<Package>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly notificationService: NotificationService,
	) {}

	public async createPackage(input: PackageInput): Promise<Package> {
		try {
			const result = await this.packageModel.create(input);
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPackages',
				modifier: 1,
			});

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getPackage(memberId: ObjectId, packageId: ObjectId): Promise<Package> {
		const search: T = {
			_id: packageId,
			packageStatus: PackageStatus.ACTIVE,
		};

		const targetPackage: Package | null = await this.packageModel.findOne(search).lean().exec();
		if (!targetPackage) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: packageId, viewGroup: ViewGroup.PACKAGE };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.packageStatsEditor({ _id: packageId, targetKey: 'packageViews', modifier: 1 });
				targetPackage.packageViews++;
			}

			const likeInput = { memberId: memberId, likeRefId: packageId, likeGroup: LikeGroup.PACKAGE };
			targetPackage.meLiked = await this.likeService.checkLikeExistance(likeInput);
		}

		// @ts-ignore
		targetPackage.memberData = await this.memberService.getMember(null, targetPackage.memberId);

		return targetPackage;
	}

	public async updatePackage(memberId: ObjectId, input: PackageUpdate): Promise<Package> {
		const search: T = {
			_id: input._id,
			memberId: memberId,
			packageStatus: { $ne: PackageStatus.DELETE },
		};

		return await this.updatePackageByStatus(search, input);
	}

	public async getPackages(memberId: ObjectId, input: PackagesInquiry): Promise<Packages> {
		const match: T = { packageStatus: PackageStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.packageModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public shapeMatchQuery(match: T, input: PackagesInquiry): void {
		const {
			memberId,
			locationList,
			typeList,
			styleList,
			photosList,
			periodsRange,
			pricesRange,
			durationsRange,
			options,
			text,
		} = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (locationList && locationList.length) match.packageLocation = { $in: locationList };
		if (typeList && typeList.length) match.packageType = { $in: typeList };
		if (styleList && styleList.length) match.packageStyle = { $in: styleList };
		if (photosList && photosList.length) match.packagePhotos = { $in: photosList };

		if (pricesRange) match.packagePrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (durationsRange) match.packageDuration = { $gte: durationsRange.start, $lte: durationsRange.end };

		if (text) match.packageTitle = { $regex: new RegExp(text, 'i') };
		if (options) {
			match['$or'] = options.map((ele) => {
				return { [ele]: true };
			});
		}
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Packages> {
		return await this.likeService.getFavoritePackages(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Packages> {
		return await this.viewService.getVisitedPackages(memberId, input);
	}

	public async getStudioPackages(memberId: ObjectId, input: StudioPackagesInquiry): Promise<Packages> {
		const { packageStatus } = input.search;
		if (packageStatus === PackageStatus.DELETE) throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			packageStatus: packageStatus ?? { $ne: PackageStatus.DELETE },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.packageModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetPackage(memberId: ObjectId, likeRefId: ObjectId): Promise<Package> {
		const target: Package | null = await this.packageModel
			.findOne({ _id: likeRefId, packageStatus: PackageStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.PACKAGE,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.packageStatsEditor({ _id: likeRefId, targetKey: 'packageLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		if (modifier > 0) {
			await this.notificationService.notify({
				notificationType: NotificationType.LIKE,
				notificationGroup: NotificationGroup.PACKAGE,
				notificationTitle: `liked your package "${target.packageTitle}"`,
				notificationRefId: likeRefId,
				authorId: memberId,
				receiverId: target.memberId,
			});
		}

		return result;
	}

	public async getAllPackagesByAdmin(input: AllPackagesInquiry): Promise<Packages> {
		const { packageStatus, packageLocationList } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (packageStatus) match.packageStatus = packageStatus;
		if (packageLocationList && packageLocationList.length) match.packageLocation = { $in: packageLocationList };

		const result = await this.packageModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit }, // [package1, package2]
							lookupMember, // memberData: [memberDataValue]
							{ $unwind: '$memberData' }, // memberData: memberDataValue
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updatePackageByAdmin(input: PackageUpdate): Promise<Package> {
		const search: T = {
			_id: input._id,
			packageStatus: { $ne: PackageStatus.DELETE },
		};

		return await this.updatePackageByStatus(search, input);
	}

	public async removePackageByAdmin(packageId: ObjectId): Promise<Package> {
		const search: T = { _id: packageId, packageStatus: PackageStatus.DELETE };
		const result = await this.packageModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async getActivePackage(packageId: ObjectId): Promise<Package> {
		const result: Package | null = await this.packageModel
			.findOne({ _id: packageId, packageStatus: PackageStatus.ACTIVE })
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	public async packageStatsEditor(input: StatisticModifier): Promise<Package> {
		const { _id, targetKey, modifier } = input;
		// @ts-ignore
		return await this.packageModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}

	/** memberPackages counts ACTIVE packages: leaving ACTIVE is -1, returning to ACTIVE is +1 **/
	public packageStatusModifier(prevStatus: PackageStatus, nextStatus?: PackageStatus): number {
		if (!nextStatus || prevStatus === nextStatus) return 0;
		if (prevStatus === PackageStatus.ACTIVE) return -1;
		if (nextStatus === PackageStatus.ACTIVE) return 1;
		return 0;
	}

	private async updatePackageByStatus(search: T, input: PackageUpdate): Promise<Package> {
		const target: Package | null = await this.packageModel.findOne(search).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const { packageStatus } = input;
		if (packageStatus === PackageStatus.PAUSE) input.pausedAt = moment().toDate();
		else if (packageStatus === PackageStatus.DELETE) input.deletedAt = moment().toDate();

		const result = await this.packageModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const modifier = this.packageStatusModifier(target.packageStatus, packageStatus);
		if (modifier) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberPackages',
				modifier: modifier,
			});
		}

		return result;
	}
}
