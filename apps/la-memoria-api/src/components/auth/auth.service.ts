import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
	private readonly googleClient = new OAuth2Client();

	constructor(private jwtService: JwtService) {}

	/** checks a Google sign-in token was issued for our app; returns the Google account id and name, or null **/
	public async verifyGoogleToken(idToken: string): Promise<{ googleId: string; name: string } | null> {
		const audience = process.env.GOOGLE_CLIENT_ID;
		if (!audience) {
			console.log('GOOGLE_CLIENT_ID is missing in .env');
			return null;
		}
		try {
			const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
			const payload = ticket.getPayload();
			return payload?.sub ? { googleId: payload.sub, name: payload.name ?? '' } : null;
		} catch (err) {
			console.log('Google token rejected:', err.message);
			return null;
		}
	}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};
		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});
		delete payload.memberPassword;
		delete payload.memberGoogleId;

		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verifyAsync(token);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}
}
