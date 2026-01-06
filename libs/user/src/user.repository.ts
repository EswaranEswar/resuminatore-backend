import { Injectable } from '@nestjs/common';
import { BaseMongodbRepository, MongodbService } from '@app/core';
import { MongoUser, MongoUserSchema, TABLE_NAMES } from '@app/shared';
import { UtilsService } from '@app/utils';

@Injectable()
export class UserRepository extends BaseMongodbRepository<MongoUser> {
  constructor(utilsService: UtilsService, mongodbService: MongodbService) {
    super(utilsService, mongodbService, MongoUserSchema, TABLE_NAMES.USERS);
  }

  async findByEmail(email: string): Promise<MongoUser | null> {
    const model = await this.getModel();
    return model.findOne({
      email,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
  }

  async updateByEmail(email: string, update: Partial<MongoUser>) {
    const model = await this.getModel();
    return model.findOneAndUpdate(
      {
        email,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
      update,
      { new: true },
    );
  }

  async findOne(filter: any): Promise<MongoUser | null> {
    const model = await this.getModel();
    return model.findOne({
      ...filter,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
  }
}
