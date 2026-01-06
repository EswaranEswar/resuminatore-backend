import { BaseDocument } from '@app/shared';
import { UtilsService } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { ClientSession, Document, Model, Schema, UpdateQuery } from 'mongoose';
import { MongodbService } from './mongodb.service';

@Injectable()
export class BaseMongodbRepository<T extends Document & BaseDocument> {
  protected readonly modelDefinition: { name: string; schema: Schema };
  constructor(
    protected readonly utilsService: UtilsService,
    protected readonly mongodbService: MongodbService,
    schema: Schema,
    tableName: string,
  ) {
    this.modelDefinition = { name: tableName, schema };
  }

  async getModel(): Promise<Model<T>> {
    return await this.mongodbService.getModel<T>(this.modelDefinition);
  }

  async create(
    data: Partial<T>,
    options?: { session?: ClientSession },
  ): Promise<T> {
    const model = await this.getModel();
    data = this.utilsService.setCreatedAtAndCreatedBy(data);
    const created = new model(data);
    return created.save(options);
  }

  async findById(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<T | null> {
    const model = await this.getModel();
    return model
      .findOne({
        _id: id,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
      .session(options?.session ?? null)
      .exec();
  }

  async findAll(
    options?: { session?: ClientSession },
    projection?: any,
  ): Promise<T[]> {
    const model = await this.getModel();
    return model
      .find(
        {
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
        projection,
      )
      .sort({ updatedAt: -1 })
      .session(options?.session ?? null)
      .exec();
  }

  async update(
    id: string,
    data: UpdateQuery<T>,
    options?: { session?: ClientSession },
  ): Promise<T | null> {
    data = this.utilsService.setUpdatedAtAndUpdatedBy(data);
    const model = await this.getModel();
    return model
      .findOneAndUpdate(
        {
          _id: id,
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
        data,
        { new: true },
      )
      .session(options?.session ?? null)
      .exec();
  }

  async deleteById(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<T | null> {
    const model = await this.getModel();
    return model
      .findOneAndUpdate(
        {
          _id: id,
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
        this.utilsService.setDeletedAtAndDeletedBy({}),
        { new: true },
      )
      .session(options?.session ?? null)
      .exec();
  }
}
