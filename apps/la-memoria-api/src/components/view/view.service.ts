import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/package/package.input';
import { Packages } from '../../libs/dto/package/package';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistance(input);
		if (!viewExist) {
			console.log('- New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistance(input: ViewInput): Promise<View> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		// @ts-ignore
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedPackages(memberId: ObjectId, input: OrdinaryInquiry): Promise<Packages> {
			const { page, limit } = input;
			const match: T = { viewGroup: ViewGroup.PACKAGE, memberId: memberId };
	
			const data: T = await this.viewModel
				.aggregate([
					{ $match: match },
					{ $sort: { updatedAt: -1 } },
					{
						$lookup: {
							from: 'packages',
							localField: 'viewRefId',
							foreignField: '_id',
							as: 'visitedPackage',
						},
					},
					{ $unwind: '$visitedPackage' },
					{
						$facet: {
							list: [
								{ $skip: (page - 1) * limit },
								{ $limit: limit },
								lookupVisit,
								{ $unwind: '$visitedPackage.memberData' },
							],
							metaCounter: [{ $count: 'total' }],
						},
					},
				])
				.exec();
	
			const result: Packages = { list: [], metaCounter: data[0].metaCounter };
			result.list = data[0].list.map((ele) => ele.visitedPackage);
			console.log('result:', result);
	
			return result;
		}
}
