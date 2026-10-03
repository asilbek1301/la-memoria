import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PackageModule } from './package/package.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		PackageModule,
		BoardArticleModule,
		LikeModule,
		ViewModule,
		CommentModule,
		FollowModule,
		ReservationModule,
	],
})
export class ComponentsModule {}
