import { BaseMongodbRepository, MongodbService } from '@app/core';
import { TABLE_NAMES } from '@app/shared';
import { MongoResume, MongoResumeSchema } from '@app/shared';
import { UtilsService } from '@app/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResumeRepository extends BaseMongodbRepository<MongoResume> {
  constructor(utilService: UtilsService, mongodbService: MongodbService) {
    super(utilService, mongodbService, MongoResumeSchema, TABLE_NAMES.RESUMES);
  }
}
