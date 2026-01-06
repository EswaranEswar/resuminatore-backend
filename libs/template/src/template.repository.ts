import { MongodbService, BaseMongodbRepository} from '@app/core';
import { TABLE_NAMES, MongoTemplate, MongoTemplateSchema } from '@app/shared';
import { UtilsService } from '@app/utils';
import { Injectable } from '@nestjs/common';
@Injectable()
export class TemplateRepository extends BaseMongodbRepository<MongoTemplate> {
  constructor(
    utilService: UtilsService,
    mongodbService: MongodbService,
  ) {
    super(
      utilService,
      mongodbService,
      MongoTemplateSchema,
      TABLE_NAMES.TEMPLATES,
    );
  }

  async findByCategory(category: string): Promise<MongoTemplate[]> {
    const model = await this.getModel();
    return model
      .find({
        category,
        deletedAt: { $exists: false },
        deletedBy: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
