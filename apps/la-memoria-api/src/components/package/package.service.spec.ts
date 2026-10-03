import { PackageService } from './package.service';
import { PackageLocation, PackageStatus, PackageStyle, PackageType } from '../../libs/enums/package.enum';
import { PackagesInquiry } from '../../libs/dto/package/package.input';
import { T } from '../../libs/types/common';

describe('PackageService', () => {
	const service = new PackageService({} as any, {} as any, {} as any, {} as any);

	describe('shapeMatchQuery', () => {
		it('maps search filters to package fields', () => {
			const match: T = { packageStatus: PackageStatus.ACTIVE };
			const input = {
				page: 1,
				limit: 10,
				search: {
					locationList: [PackageLocation.SEOUL, PackageLocation.JEJU],
					typeList: [PackageType.GOLD],
					styleList: [PackageStyle.VINTAGE],
					photosList: [50, 100],
					pricesRange: { start: 100, end: 500 },
					durationsRange: { start: 1.5, end: 4 },
					options: ['packageAlbum', 'packageMakeup'],
					text: 'sunset',
				},
			} as PackagesInquiry;

			service.shapeMatchQuery(match, input);

			expect(match).toEqual({
				packageStatus: PackageStatus.ACTIVE,
				packageLocation: { $in: [PackageLocation.SEOUL, PackageLocation.JEJU] },
				packageType: { $in: [PackageType.GOLD] },
				packageStyle: { $in: [PackageStyle.VINTAGE] },
				packagePhotos: { $in: [50, 100] },
				packagePrice: { $gte: 100, $lte: 500 },
				packageDuration: { $gte: 1.5, $lte: 4 },
				packageTitle: { $regex: /sunset/i },
				$or: [{ packageAlbum: true }, { packageMakeup: true }],
			});
		});

		it('ignores empty lists', () => {
			const match: T = {};
			const input: PackagesInquiry = { page: 1, limit: 10, search: { locationList: [], styleList: [] } };
			service.shapeMatchQuery(match, input);

			expect(match).toEqual({});
		});
	});

	describe('packageStatusModifier', () => {
		it.each([
			[PackageStatus.ACTIVE, PackageStatus.PAUSE, -1],
			[PackageStatus.ACTIVE, PackageStatus.DELETE, -1],
			[PackageStatus.ACTIVE, PackageStatus.HOLD, -1],
			[PackageStatus.PAUSE, PackageStatus.ACTIVE, 1],
			[PackageStatus.HOLD, PackageStatus.ACTIVE, 1],
			[PackageStatus.PAUSE, PackageStatus.DELETE, 0],
			[PackageStatus.ACTIVE, PackageStatus.ACTIVE, 0],
			[PackageStatus.ACTIVE, undefined, 0],
		])('%s -> %s changes memberPackages by %d', (prev, next, expected) => {
			expect(service.packageStatusModifier(prev, next)).toBe(expected);
		});
	});
});
