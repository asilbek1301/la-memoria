import { Module } from '@nestjs/common';
import { PackageResolver } from './package.resolver';
import { PackageService } from './package.service';
import { MongooseModule } from '@nestjs/mongoose';
import PackageSchema from '../../schemas/Package.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Package',
				schema: PackageSchema,
			},
		]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
	],
	providers: [PackageResolver, PackageService],
	exports: [PackageService],
})
export class PackageModule {}
