import {
  CreateUserDto,
  CreateUserSchema,
  ProviderType,
  UserSchema,
  UserType,
  UpdateUserSchema,
  UpdateUserDto,
} from '@app/shared';
import { UserRepository } from './user.repository';
import { ClsService } from 'nestjs-cls';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clsService: ClsService,
  ) {}

  get userId(): string {
    const sessionUser = this.clsService.get('session')?.user;
    if (!sessionUser?.id) {
      throw new BadRequestException('User ID not found in session');
    }
    return sessionUser.id;
  }

  async getAllUsers() {
    const data = await this.userRepository.findAll();
    const parsedResult = UserSchema.array().safeParse(data);
    if (!parsedResult.success) {
      throw new BadRequestException(parsedResult.error.message);
    }
    return parsedResult.data;
  }

  async getProfile() {
    const id = this.userId;
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BadRequestException('User Profile Not Found');
    }
    const parsedResult = UserSchema.safeParse(user);
    if (!parsedResult.success) {
      throw new BadRequestException(parsedResult.error.message);
    }
    return parsedResult.data;
  }

  async updateProfile(update: Partial<UpdateUserDto>): Promise<UserType> {
    const id = this.userId;
    const parseRequest = UpdateUserSchema.safeParse(update);
    if (parseRequest.success === false) {
      throw new BadRequestException(parseRequest.error.message);
    }
    const newUpdate = await this.userRepository.update(id, {
      ...parseRequest.data,
    });
    const parseResult = UserSchema.safeParse(newUpdate);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async createUser(data: Partial<CreateUserDto>): Promise<UserType> {
    const parseRequest = CreateUserSchema.safeParse(data);
    if (parseRequest.success === false) {
      throw new BadRequestException(parseRequest.error.message);
    }

    const newUser = await this.userRepository.create({
      ...parseRequest.data,
    });
    const parseResult = UserSchema.safeParse(newUser);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async findByUserId(id: string) {
    const userId = await this.userRepository.findById(id);
    if (!userId) {
      return null;
    }
    const parseResult = UserSchema.safeParse(userId);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async findByEmail(email: string): Promise<UserType | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    const parseResult = UserSchema.safeParse(user);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async findByProviderId(providerdata: {
    provider: ProviderType;
    providerId: string;
  }): Promise<UserType | null> {
    const providerdatas = await this.userRepository.findOne(providerdata);
    if (!providerdatas) {
      return null;
    }
    const parseResult = UserSchema.safeParse(providerdatas);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async linkOAuthToExistingUser(linkdata: {
    email: string;
    provider: ProviderType;
    providerId: string;
    avatar?: string;
  }) {
    const linkeddatas = await this.findByEmail(linkdata.email);
    const parseRequest = UserSchema.safeParse(linkeddatas);
    if (parseRequest.success === false) {
      throw new BadRequestException(parseRequest.error.message);
    }
    const updateLinkedData = await this.userRepository.updateByEmail(
      linkdata.email,
      {
        provider: linkdata.provider,
        providerId: linkdata.providerId,
        avatar: linkdata.avatar ?? null,
        isVerified: true,
      },
    );
    if (!updateLinkedData) {
      throw new BadRequestException('Failed to update user during OAuth link');
    }
    const parseResult = UserSchema.safeParse(updateLinkedData);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async verifyUser(email: string): Promise<UserType> {
    const Updated = await this.userRepository.updateByEmail(email, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    });
    const parseResult = UserSchema.safeParse(Updated);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async updateUserByEmail(email: string, update: Partial<UserType>) {
    const Updated = await this.userRepository.updateByEmail(email, update);
    const parseResult = UserSchema.safeParse(Updated);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async updateUserById(id: string, update: Partial<UpdateUserDto>) {
    const parseRequest = UpdateUserSchema.safeParse(update);
    if (parseRequest.success === false) {
      throw new BadRequestException(parseRequest.error.message);
    }
    const Updated = await this.userRepository.update(id, update);
    const parseResult = UserSchema.safeParse(Updated);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async updateUserRole(id: string, role: 'user' | 'admin') {
    const Updated = await this.userRepository.update(id, { role } as any);
    if (!Updated) {
      throw new BadRequestException('User not found');
    }
    const parseResult = UserSchema.safeParse(Updated);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }

  async deleteUserById(id: string) {
    const deleted = await this.userRepository.deleteById(id);
    if (!deleted) {
      throw new BadRequestException('User not found');
    }
    const parseResult = UserSchema.safeParse(deleted);
    if (parseResult.success === false) {
      throw new BadRequestException(parseResult.error.message);
    }
    return parseResult.data;
  }
}
